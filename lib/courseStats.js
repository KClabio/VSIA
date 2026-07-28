function courseStats(course, completedLessons) {
  let total = 0;
  (course.modules || []).forEach((m) => { total += (m.lessons || []).length; });
  const done = (completedLessons || []).filter((id) =>
    (course.modules || []).some((m) => (m.lessons || []).some((l) => String(l._id) === id))
  ).length;
  return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

module.exports = { courseStats };
