import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, FormEvent, TouchEvent } from 'react';
import classnames from 'classnames';
import { StepperProps } from './PropsType';
import { isNaN } from '../utils/validate/number';
import { callInterceptor } from '../utils/interceptor';
import { addUnit, getSizeStyle, isDef, formatNumber, resetScroll, preventDefault } from '../utils';
import ConfigProviderContext from '../config-provider/ConfigProviderContext';
import { COMPONENT_TYPE_KEY } from '../utils/constant';

const LONG_PRESS_INTERVAL = 200;
const LONG_PRESS_START_TIME = 600;

function equal(value1?: string | number, value2?: string | number) {
  return String(value1) === String(value2);
}

// add num and avoid float number
function add(num1: number, num2: number) {
  const cardinal = 10 ** 10;
  return Math.round((num1 + num2) * cardinal) / cardinal;
}

const Stepper: React.FC<StepperProps> = (props) => {
  const { prefixCls, createNamespace } = useContext(ConfigProviderContext);
  const [bem] = createNamespace('stepper', prefixCls);

  const format = (value: string | number) => {
    const { min, max, allowEmpty, decimalLength } = props;

    if (allowEmpty && value === '') {
      return value;
    }

    value = formatNumber(String(value), !props.integer);
    value = value === '' ? 0 : +value;
    value = isNaN(value) ? +min : value;
    value = Math.max(Math.min(+max, value), +min);

    // format decimal
    if (isDef(decimalLength)) {
      value = value.toFixed(+decimalLength);
    }

    return value;
  };

  const getInitialValue = () => {
    const defaultValue = props.value ?? props.defaultValue;
    const value = format(defaultValue);
    return value;
  };

  let actionType: 'plus' | 'minus';
  const inputRef = useRef(null);
  const innerEffectRef = useRef(false);
  const preValue = useRef(getInitialValue());
  const [current, setCurrent] = useState(() => preValue.current);

  const minusDisabled = useMemo(
    () => props.disabled || props.disableMinus || current <= +props.min,
    [props.disabled, props.disableMinus, current],
  );

  const plusDisabled = useMemo(
    () => props.disabled || props.disablePlus || current >= +props.max,
    [props.disabled, props.disablePlus, current],
  );

  const inputStyle = useMemo(
    () => ({
      width: addUnit(props.inputWidth),
      height: addUnit(props.buttonSize),
    }),
    [props.inputWidth, props.buttonSize],
  );

  const buttonStyle = useMemo(() => getSizeStyle(props.buttonSize), [props.buttonSize]);

  const innerChange = (value: number | string) => {
    innerEffectRef.current = true;
    setCurrent(value);
    props.onChange?.(+value);
  };
  const check = () => {
    const value = format(current);
    if (!equal(value, current)) {
      innerChange(value);
    }
  };

  const setValue = (value: string | number) => {
    if (props.beforeChange) {
      callInterceptor({
        args: [value],
        interceptor: props.beforeChange,
        done() {
          innerChange(value);
        },
      });
    } else {
      innerChange(value);
    }
  };

  const onChange = () => {
    if ((actionType === 'plus' && plusDisabled) || (actionType === 'minus' && minusDisabled)) {
      props.onOverlimit?.(actionType);
      return;
    }

    const diff = actionType === 'minus' ? -props.step : +props.step;
    const value = format(add(+preValue.current || +current, diff));
    setValue(value);
    preValue.current = value;
    props[`on${actionType.replace(/^\S/, (s) => s.toUpperCase())}`]?.(actionType);
  };

  const onInput = (event: FormEvent) => {
    const input = event.target as HTMLInputElement;
    const { value } = input;
    const { decimalLength } = props;

    let formatted = formatNumber(String(value), !props.integer);

    // limit max decimal length
    if (isDef(decimalLength) && formatted.includes('.')) {
      const pair = formatted.split('.');
      formatted = `${pair[0]}.${pair[1].slice(0, +decimalLength)}`;
    }
    // prefer number type
    const isNumeric = formatted === String(+formatted);
    setValue(isNumeric ? +formatted : formatted);
  };

  const onFocus = (event: FormEvent) => {
    // readonly not work in lagacy mobile safari
    if (props.disableInput && inputRef.current) {
      inputRef.current.blur();
    } else {
      props.onFocus?.(event);
    }
  };

  const onBlur = (event: FormEvent) => {
    const input = event.target as HTMLInputElement;
    const value = format(input.value);
    preValue.current = value;
    props.onBlur?.(event);
    resetScroll();
  };

  const isLongPress = useRef<boolean>(false);
  const longPressTimer = useRef<NodeJS.Timeout>(null);

  const longPressStep = () => {
    longPressTimer.current = setTimeout(() => {
      onChange();
      longPressStep();
    }, LONG_PRESS_INTERVAL);
  };

  const onTouchStart = () => {
    if (props.longPress) {
      isLongPress.current = false;
      clearTimeout(longPressTimer.current);
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        onChange();
        longPressStep();
      }, LONG_PRESS_START_TIME);
    }
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (props.longPress) {
      clearTimeout(longPressTimer.current);
      if (isLongPress.current) {
        preventDefault(event);
      }
    }
  };

  const onMousedown = (event: MouseEvent) => {
    // fix mobile safari page scroll down issue
    // see: https://github.com/youzan/vant/issues/7690
    if (props.disableInput) {
      event.preventDefault();
    }
  };

  const createListeners = (type: 'plus' | 'minus') => ({
    onClick: (event: MouseEvent) => {
      // disable double tap scrolling on mobile safari
      event.preventDefault();
      actionType = type;
      onChange();
    },
    onTouchStart: () => {
      actionType = type;
      onTouchStart();
    },
    onTouchEnd,
    onTouchCancel: onTouchEnd,
  });

  useEffect(() => {
    if (innerEffectRef.current) {
      innerEffectRef.current = false;
      return;
    }
    setCurrent(props.value);
  }, [props.value]);

  useEffect(() => check, [props.max, props.min, props.integer, props.decimalLength]);

  return (
    <div className={classnames(props.className, bem([props.theme]))} style={props.style}>
      {props.showMinus && (
        <button
          type="button"
          aria-label="minus"
          style={buttonStyle}
          className={classnames(bem('minus', { disabled: minusDisabled }))}
          {...createListeners('minus')}
        />
      )}
      {props.showInput && (
        <input
          ref={inputRef}
          type={props.integer ? 'tel' : 'text'}
          role="spinbutton"
          className={classnames(bem('input'))}
          value={current || ''}
          style={inputStyle}
          disabled={props.disabled}
          readOnly={props.disableInput}
          inputMode={props.integer ? 'numeric' : 'decimal'}
          placeholder={props.placeholder}
          aria-valuemax={+props.max as number}
          aria-valuemin={+props.min as number}
          aria-valuenow={+current as number}
          onChange={onInput}
          onBlur={onBlur}
          onFocus={onFocus}
          onMouseDown={onMousedown}
        />
      )}
      {props.showPlus && (
        <button
          type="button"
          aria-label="add"
          style={buttonStyle}
          className={classnames(bem('plus', { disabled: plusDisabled }))}
          {...createListeners('plus')}
        />
      )}
    </div>
  );
};
Stepper.defaultProps = {
  theme: 'default',
  max: Number.MAX_VALUE,
  min: 1,
  step: 1,
  defaultValue: 1,
  showPlus: true,
  showMinus: true,
  showInput: true,
  longPress: true,
};

export const STEPPER_KEY = Symbol('stepper');
const StepperNamespace = Object.assign(Stepper, { [COMPONENT_TYPE_KEY]: STEPPER_KEY });
export default StepperNamespace;
