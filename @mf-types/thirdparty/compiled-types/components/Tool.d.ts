import { JSX } from 'react';
interface ToolProps {
    /**
     * The shell can pass a session, branding hints, or other host context
     * down through props. Documented contract — not enforced.
     */
    session?: {
        userName?: string;
        agency?: string;
    };
}
/**
 * The third-party AI tool component. Exposed via Module Federation as
 * `thirdparty/Tool`. Inherits the host's CSS custom properties at render
 * because it mounts inside the host's DOM — that's how POC 1's branding
 * mechanism still applies here.
 */
declare function Tool({ session }: ToolProps): JSX.Element;
export default Tool;
