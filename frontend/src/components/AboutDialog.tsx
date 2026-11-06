import React from "react";

import { PRODUCT_NAME } from "../brand";

export const AboutDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="whiteboardrt-agent-about-backdrop" onClick={onClose}>
      <div
        className="whiteboardrt-agent-about"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whiteboardrt-agent-about-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="whiteboardrt-agent-about-title">About {PRODUCT_NAME}</h2>
        <p>
          {PRODUCT_NAME} is a live canvas for AI agents to draw, inspect, and
          refine diagrams.
        </p>
        <p>
          This product is a modified fork of mcp_excalidraw, which is licensed
          under the MIT License. It is not affiliated with or endorsed by
          Excalidraw.
        </p>
        <p>
          <a href="/THIRD_PARTY_NOTICES.txt" target="_blank" rel="noopener">
            Third-party notices and licenses
          </a>
          {" · "}
          <a href="/LICENSE" target="_blank" rel="noopener">
            MIT License
          </a>
        </p>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
