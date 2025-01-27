import React from "react";

const AboutModal = ({ onClose }) => (
  <div className="modal">
    <div className="modal-content">
      <h2>About AI Doctor</h2>
      <p>
        AI Doctor is a virtual assistant for business analysis, powered by
        advanced AI. It helps you make informed decisions by analyzing data,
        answering queries, and providing insights.
      </p>
      <button onClick={onClose}>Close</button>
    </div>
  </div>
);

export default AboutModal;

