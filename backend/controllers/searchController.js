/**
 * Controller for Search functions
 * Handles search functionality across the system
 */

const globalSearch = async (query) => {
  return { results: [], query };
};

const searchUsers = async (query) => {
  return { users: [], query };
};

const searchBlocks = async (query) => {
  return { blocks: [], query };
};

const searchQuestions = async (query) => {
  return { questions: [], query };
};

const searchClasses = async (query) => {
  return { classes: [], query };
};

const searchTournaments = async (query) => {
  return { tournaments: [], query };
};

module.exports = {
  globalSearch,
  searchUsers,
  searchBlocks,
  searchQuestions,
  searchClasses,
  searchTournaments
};