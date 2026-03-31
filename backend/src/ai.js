const { config } = require("./config");

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function buildFallbackSubtasks(task) {
  const startDate = task.dueDate ? new Date(task.dueDate) : addDays(new Date(), 7);
  const titles = [
    `Design the frontend screen flow and split "${task.title}" into reusable UI components`,
    `Implement the frontend components, page states, and user interactions for "${task.title}"`,
    `Design backend APIs and modify database tables or schema needed for "${task.title}"`,
    `Implement backend business logic, validations, and integration for "${task.title}"`,
    `Write unit tests and detailed test cases covering "${task.title}" across frontend and backend`,
    `Document how "${task.title}" will be tested, including QA flow, edge cases, and acceptance checks`,
  ];

  return titles.map((title, index) => ({
    title,
    storyPoints: Math.min(8, Math.max(1, index + 1)),
    dueDate: addDays(startDate, index - titles.length).toISOString(),
  }));
}

function buildFallbackDescriptionDraft(payload) {
  return [
    `Objective: ${payload.title}.`,
    `Priority: ${payload.priority}.`,
    payload.context
      ? `Current context: ${payload.context}.`
      : "Current context: refine the scope into clear deliverables and acceptance criteria.",
    "Expected outcome: ship a production-ready task that is easy to assign, review, and demo.",
    "Success criteria: dependencies are clear, ownership is explicit, and completion can be verified quickly.",
  ].join(" ");
}

function extractOutputText(data) {
  return (
    data.output_text ||
    data.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("") ||
    ""
  );
}

function normalizeSuggestion(item) {
  if (!item) return null;
  if (typeof item === "string") {
    return {
      title: item.trim(),
      storyPoints: 1,
      dueDate: null,
    };
  }

  const title = String(item.title || "").trim();
  if (!title) return null;

  return {
    title,
    storyPoints: Number.isFinite(item.storyPoints) ? Math.max(1, Math.min(13, Number(item.storyPoints))) : 1,
    dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
  };
}

async function generateSubtasksWithOpenAI(task) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openAiModel,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                'You generate Jira-style software delivery subtasks. Return only a JSON array of 6 objects with title, storyPoints, and dueDate in ISO format. The 6 subtasks must cover these aspects in order: (1) frontend screen planning and component split, (2) frontend implementation, (3) backend API plus database/table/schema design or modification, (4) backend implementation, (5) unit testing plus detailed test cases, (6) testing approach covering QA steps, validation method, and acceptance checks. Make every title concrete and specific to the task.',
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Task title: ${task.title}\nTask description: ${task.description}\nPriority: ${task.priority}\nStory points: ${task.storyPoints}\nTask due date: ${task.dueDate || "Not set"}\nCreate execution-oriented subtasks that explicitly cover frontend screens broken into components, backend design including table/schema changes, unit testing, test cases, and how testing will be performed.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${detail}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(extractOutputText(data) || "[]");

  if (!Array.isArray(parsed)) {
    throw new Error("OpenAI response was not a JSON array.");
  }

  return parsed.map(normalizeSuggestion).filter(Boolean).slice(0, 6);
}

async function generateSubtasks(task) {
  if (!config.openAiApiKey) {
    return {
      source: "fallback",
      suggestions: buildFallbackSubtasks(task),
    };
  }

  try {
    const suggestions = await generateSubtasksWithOpenAI(task);
    if (!suggestions.length) {
      throw new Error("No subtasks were returned by the model.");
    }

    return {
      source: "openai",
      suggestions,
    };
  } catch (error) {
    return {
      source: "fallback",
      suggestions: buildFallbackSubtasks(task),
      warning: error.message,
    };
  }
}

async function enhanceDescriptionWithOpenAI(payload) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openAiModel,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You improve project task descriptions for software teams. Return one polished paragraph only.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Task title: ${payload.title}\nPriority: ${payload.priority}\nContext: ${payload.context || "None"}\nWrite a concise but production-ready task description.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${detail}`);
  }

  const data = await response.json();
  const description = extractOutputText(data).trim();

  if (!description) {
    throw new Error("OpenAI did not return a task description.");
  }

  return description;
}

async function enhanceTaskDescription(payload) {
  if (!config.openAiApiKey) {
    return {
      source: "fallback",
      description: buildFallbackDescriptionDraft(payload),
    };
  }

  try {
    const description = await enhanceDescriptionWithOpenAI(payload);
    return {
      source: "openai",
      description,
    };
  } catch (error) {
    return {
      source: "fallback",
      description: buildFallbackDescriptionDraft(payload),
      warning: error.message,
    };
  }
}

module.exports = { generateSubtasks, enhanceTaskDescription };
