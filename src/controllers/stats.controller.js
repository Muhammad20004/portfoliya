import User from "../models/user.js";
import Project from "../models/project.js";

export async function dashboardStats(req, res) {
  const [
    students,
    teachers,
    projectsTotal,
    approved,
    pending,
    rejected,
  ] = await Promise.all([
    User.countDocuments({ role: "STUDENT" }),
    User.countDocuments({ role: "TEACHER" }),
    Project.countDocuments({}),
    Project.countDocuments({ status: "APPROVED" }),
    Project.countDocuments({ status: "PENDING" }),
    Project.countDocuments({ status: "REJECTED" }),
  ]);

  const techAgg = await Project.aggregate([
    { $unwind: "$technologies" },
    { $match: { technologies: { $ne: "" } } },
    { $group: { _id: "$technologies", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);

  return res.json({
    users: { students, teachers },
    projects: { total: projectsTotal, approved, pending, rejected },
    topTechnologies: techAgg.map((x) => ({ tech: x._id, count: x.count })),
  });
}
