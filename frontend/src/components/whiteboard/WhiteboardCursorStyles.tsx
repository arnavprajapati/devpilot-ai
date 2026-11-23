export function WhiteboardCursorStyles() {
  return (
    <style>{`
      .whiteboard-canvas,
      .whiteboard-canvas .react-flow,
      .whiteboard-canvas .react-flow__pane,
      .whiteboard-canvas .react-flow__viewport {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23000000' stroke='%23ffffff' stroke-width='1.5'%3E%3Cpolygon points='2,2 2,19 7,14 11,21 13.5,19.5 9.5,12.5 16,12.5'/%3E%3C/svg%3E") 2 2, default !important;
      }
      .whiteboard-canvas .react-flow__pane.dragging,
      .whiteboard-canvas .react-flow__pane:active {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23000000' stroke='%23ffffff' stroke-width='1.5'%3E%3Cpath d='M10 2a1 1 0 0 1 1 1v5a1 1 0 0 1 2 0V4a1 1 0 0 1 2 0v5a1 1 0 0 1 2 0V6a1 1 0 0 1 2 0v8a6 6 0 0 1-6 6H9a6 6 0 0 1-5.6-3.8L2.2 14a1 1 0 0 1 1.6-1.2L6 15V3a1 1 0 0 1 2-1h2z'/%3E%3C/svg%3E") 10 10, grabbing !important;
      }
      .whiteboard-canvas .react-flow__node,
      .whiteboard-canvas .react-flow__node *,
      .whiteboard-canvas .react-flow__handle,
      .whiteboard-canvas .react-flow__handle *,
      .whiteboard-canvas button,
      .whiteboard-canvas button * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23000000' stroke='%23ffffff' stroke-width='1.5'%3E%3Cpath d='M8 1a1 1 0 0 1 1 1v8h1V4a1 1 0 0 1 2 0v7h1V6a1 1 0 0 1 2 0v5h1V8a1 1 0 0 1 2 0v7a6 6 0 0 1-6 6H9a6 6 0 0 1-5.6-3.8L2.2 14a1 1 0 0 1 1.6-1.2L6 15V2a1 1 0 0 1 2-1z'/%3E%3C/svg%3E") 8 1, pointer !important;
      }
      .whiteboard-canvas input,
      .whiteboard-canvas textarea {
        cursor: text !important;
        caret-color: #000000 !important;
      }
    `}</style>
  );
}
