// src/conditional.js
export function evaluateCondition(cond, answersSoFar) {
  const { questionKey, operator, value } = cond;
  const answer = answersSoFar?.[questionKey];

  if (answer === undefined || answer === null) {
    if (operator === "equals")
      return value === null || value === undefined || value === "";
    if (operator === "contains") return false;
    if (operator === "notEquals")
      return value !== null && value !== undefined && value !== "";
  }

  if (operator === "equals") {
    if (Array.isArray(answer)) return answer.includes(value);
    return answer === value;
  }
  if (operator === "notEquals") {
    if (Array.isArray(answer)) return !answer.includes(value);
    return answer !== value;
  }
  if (operator === "contains") {
    if (Array.isArray(answer)) return answer.includes(value);
    if (typeof answer === "string")
      return answer.indexOf(String(value)) !== -1;
    return false;
  }
  return false;
}

export function shouldShowQuestion(rules, answersSoFar) {
  if (!rules) return true;
  const { logic = "AND", conditions = [] } = rules;
  if (!conditions.length) return true;
  const results = conditions.map((c) => {
    try {
      return evaluateCondition(c, answersSoFar);
    } catch (e) {
      return false;
    }
  });
  if (logic === "AND") return results.every(Boolean);
  return results.some(Boolean);
}
