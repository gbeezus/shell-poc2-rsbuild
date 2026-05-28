declare module 'thirdparty/Tool' {
  import { ComponentType } from 'react';
  interface ToolProps {
    session?: { userName?: string; agency?: string };
  }
  const Tool: ComponentType<ToolProps>;
  export default Tool;
}
