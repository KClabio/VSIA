const Course = require('../models/Course');
const Article = require('../models/Article');
const Enrollment = require('../models/Enrollment');

const TOOL_DECLARATIONS = [
  {
    name: 'search_courses',
    description: 'Tìm kiếm khóa học trong hệ thống VSIA theo từ khóa, danh mục hoặc miễn phí/trả phí. Luôn dùng công cụ này trước khi trả lời câu hỏi về khóa học cụ thể.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Từ khóa tìm trong tên hoặc mô tả khóa học' },
        category: { type: 'string', description: 'Danh mục khóa học, ví dụ: STEM' },
        isFree: { type: 'boolean', description: 'true nếu chỉ tìm khóa học miễn phí' },
      },
    },
  },
  {
    name: 'search_articles',
    description: 'Tìm kiếm bài viết/tin tức trong hệ thống VSIA theo từ khóa. Luôn dùng công cụ này trước khi trả lời câu hỏi về tin tức, bài viết cụ thể.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Từ khóa tìm trong tiêu đề, tóm tắt hoặc nội dung bài viết' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'enroll_in_course',
    description: 'Đăng ký (ghi danh) người dùng đang trò chuyện vào một khóa học cụ thể. Chỉ gọi khi người dùng rõ ràng yêu cầu đăng ký/ghi danh vào một khóa học đã xác định được course_id qua search_courses.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        course_id: { type: 'string', description: 'ID khóa học cần đăng ký, lấy từ kết quả search_courses' },
      },
      required: ['course_id'],
    },
  },
];

function buildRegex(keyword) {
  return new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

async function searchCourses({ keyword, category, isFree } = {}) {
  const filter = {};
  const and = [];
  if (keyword && keyword.trim()) {
    const regex = buildRegex(keyword.trim());
    and.push({ $or: [{ title: regex }, { description: regex }, { category: regex }] });
  }
  if (category && category.trim()) {
    and.push({ category: buildRegex(category.trim()) });
  }
  if (typeof isFree === 'boolean') {
    and.push({ isFree });
  }
  if (and.length) filter.$and = and;

  const courses = await Course.find(filter).sort({ createdAt: -1 }).limit(5).lean();
  if (!courses.length) {
    return { results: [], message: 'Không tìm thấy khóa học phù hợp.' };
  }
  return {
    results: courses.map((c) => ({
      id: String(c._id),
      title: c.title,
      category: c.category,
      isFree: c.isFree,
      price: c.price,
      instructor: c.instructor,
      description: c.description,
    })),
  };
}

async function searchArticles({ keyword } = {}) {
  if (!keyword || !keyword.trim()) {
    return { results: [], message: 'Cần cung cấp từ khóa tìm kiếm.' };
  }
  const regex = buildRegex(keyword.trim());
  const articles = await Article.find({ $or: [{ title: regex }, { summary: regex }, { content: regex }] })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  if (!articles.length) {
    return { results: [], message: 'Không tìm thấy bài viết phù hợp.' };
  }
  return {
    results: articles.map((a) => ({
      id: String(a._id),
      title: a.title,
      summary: a.summary,
    })),
  };
}

async function enrollInCourse({ course_id: courseId }, req) {
  if (!req.user) {
    return { error: 'not_authenticated', message: 'Người dùng chưa đăng nhập, cần yêu cầu họ đăng nhập trước khi đăng ký khóa học.' };
  }
  if (!courseId) {
    return { error: 'missing_course_id', message: 'Thiếu course_id.' };
  }

  const course = await Course.findById(courseId).lean().catch(() => null);
  if (!course) {
    return { error: 'course_not_found', message: 'Không tìm thấy khóa học với course_id đã cho.' };
  }

  await Enrollment.findOneAndUpdate(
    { user: req.user._id, course: course._id },
    { $setOnInsert: { user: req.user._id, course: course._id, completedLessons: [], enrolledAt: new Date() } },
    { upsert: true },
  );

  return {
    success: true,
    courseTitle: course.title,
    courseUrl: `/hoc/${course._id}`,
  };
}

async function executeTool(name, args, req) {
  switch (name) {
    case 'search_courses':
      return searchCourses(args || {});
    case 'search_articles':
      return searchArticles(args || {});
    case 'enroll_in_course':
      return enrollInCourse(args || {}, req);
    default:
      return { error: 'unknown_tool', message: `Không có công cụ tên "${name}".` };
  }
}

module.exports = { TOOL_DECLARATIONS, executeTool };
