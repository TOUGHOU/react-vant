import React, { useState } from 'react';
import { Grid, Toast } from 'react-vant';
import { components } from 'site-mobile-demo';
import Sidebar from '..';
import './style.less';

export default (): React.ReactNode => {
  const { DemoBlock, DemoSection } = components;
  const [ac, setAc] = useState(2);
  return (
    <DemoSection className="demo-sidebar">
      <Grid columnNum={2} border={false}>
        <Grid.Item>
          <DemoBlock title="基础用法">
            <Sidebar>
              <Sidebar.Item title="标签名" />
              <Sidebar.Item title="标签名" />
              <Sidebar.Item title="标签名" />
            </Sidebar>
          </DemoBlock>
        </Grid.Item>
        <Grid.Item>
          <DemoBlock title="徽标提示">
            <Sidebar>
              <Sidebar.Item title="标签名" dot />
              <Sidebar.Item title="标签名" badge={5} />
              <Sidebar.Item title="标签名" badge={20} />
            </Sidebar>
          </DemoBlock>
        </Grid.Item>
        <Grid.Item>
          <DemoBlock title="禁用选项">
            <Sidebar>
              <Sidebar.Item title="标签名" />
              <Sidebar.Item title="标签名" disabled />
              <Sidebar.Item title="标签名" />
            </Sidebar>
          </DemoBlock>
        </Grid.Item>
        <Grid.Item>
          <DemoBlock title="监听切换事件">
            <Sidebar
              value={ac}
              onChange={(v) => {
                setAc(v);
                Toast.info(`标签名 ${v + 1}`);
              }}
            >
              <Sidebar.Item title="标签名1" />
              <Sidebar.Item title="标签名2" />
              <Sidebar.Item title="标签名3" />
            </Sidebar>
          </DemoBlock>
        </Grid.Item>
      </Grid>
    </DemoSection>
  );
};
