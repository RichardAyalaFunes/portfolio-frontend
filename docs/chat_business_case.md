# Chat Features - Business Cases & Requirements

This document defines the business cases and requirements for the new `/chat` features, utilizing the Spec-Driven Development methodology (EARS format).

## BC 1. Text Interaction
**User Story:** As a user, I want to send text messages to the AI and receive text responses, so that I can have a standard conversational experience.
**Notes:** The backend handles the logic of the response. The frontend's responsibility is solely to send and receive the response.

**Acceptance Criteria:**
1. WHEN the user sends a text message THEN the system SHALL transmit the message to the backend.
2. WHEN the backend processes the message THEN the system SHALL display the AI's final text response in the chat history.
3. WHEN waiting for the final response THEN the system SHALL utilize the Workflow Status Feedback (BC 2) to display progress.

## BC 2. Workflow Status Feedback
**User Story:** As a user, I want to see which n8n workflows/agents were executed while waiting for a response, so that I understand the AI's thought process behind the scenes.
**Notes:** This is a portfolio project feature to show the internal workings. This is not the "official" answer but intermediate feedback. (Implementation deferred until backend capabilities are defined, potentially using WebSockets).

**Acceptance Criteria:**
1. WHEN the AI is processing a request THEN the system SHALL receive multiple status update messages.
2. WHEN a status update is received THEN the system SHALL render non-official feedback in the chat UI indicating which agent was called.
3. WHEN the final response is ready THEN the system SHALL display the final AI answer, distinct from the status updates.

## BC 3. Sending Attachments
**User Story:** As a user, I want to send a file attachment to the backend AI along with my message, so that the AI can analyze my provided documents or images.
**Notes:** Currently restricted to a single attachment per message. Future versions may support multiple attachments.

**Acceptance Criteria:**
1. WHEN the user selects exactly one file THEN the system SHALL attach it to the pending message.
2. WHEN the user sends the message THEN the system SHALL transmit both the text formulation and the attached file to the backend.

## BC 4. Receiving Media Files
**User Story:** As a user, I want to receive files (images, videos, audio) from the backend AI, so that I can consume rich media responses.

**Acceptance Criteria:**
1. WHEN the backend responds with a file payload THEN the system SHALL render a corresponding file icon (based on file type) and the filename in the chat interface.
2. WHEN the file message is successfully processed by the frontend THEN the system SHALL automatically trigger a download of the file to the user's device.

## BC 5. Interactive Chat Forms
**User Story:** As a user, I want to fill out specific forms (e.g., Send Email Form) inside the chat when requested by the AI, so that I can provide structured information efficiently.
**Notes:** The form will completely replace the standard text input area in the `ChatWindow.tsx`.

**Acceptance Criteria:**
1. WHEN the backend sends a form-type message THEN the system SHALL dynamically replace the standard user input message component with the requested form component.
2. IF the requested form-type is "send-email-form" THEN the system SHALL display a form containing `receiver-email`, `subject`, and `body` fields.
3. WHEN a form component is active THEN the system SHALL provide a "Close button".
4. IF the user clicks the "Close button" THEN the system SHALL dismiss the form and revert the UI back to the standard text input area.
5. WHEN the user submits the completed form THEN the system SHALL send the structured form data back to the AI.
 