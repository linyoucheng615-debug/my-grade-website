/**
 * 老師帳號權限與負責學生解析工具
 */

export interface ParsedTeacherPermissions {
  isAdmin: boolean;
  assignedStudents: string[];
  rawRole: "admin" | "teacher";
}

/**
 * 解析資料庫回傳的老師物件，取出是否為管理員與所指派的學生清單
 */
export function parseTeacherPermissions(teacher: any): ParsedTeacherPermissions {
  if (!teacher) {
    return { isAdmin: false, assignedStudents: [], rawRole: "teacher" };
  }

  const roleVal = teacher.role;

  // 1. 若 role 為 'admin'，為全權限系統管理員
  if (roleVal === "admin") {
    return { isAdmin: true, assignedStudents: [], rawRole: "admin" };
  }

  // 2. 若 role 存放 JSON 字串，例如 {"role":"teacher","students":["廖家臻","李杰修"]}
  if (typeof roleVal === "string" && roleVal.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(roleVal);
      const isAdmin = parsed.role === "admin";
      const students = Array.isArray(parsed.students) ? parsed.students : [];
      return {
        isAdmin,
        assignedStudents: students,
        rawRole: (parsed.role as "admin" | "teacher") || "teacher",
      };
    } catch {
      // JSON 解析失敗則走預設
    }
  }

  // 3. 若未來直接存在 assigned_students 欄位中
  if (Array.isArray(teacher.assigned_students)) {
    return {
      isAdmin: teacher.role === "admin",
      assignedStudents: teacher.assigned_students,
      rawRole: (teacher.role as "admin" | "teacher") || "teacher",
    };
  }

  // 4. 預設為一般協同老師
  return {
    isAdmin: false,
    assignedStudents: [],
    rawRole: (roleVal as "admin" | "teacher") || "teacher",
  };
}

/**
 * 將前端設定的角色類型與學生指派清單編碼儲存至 role 欄位
 */
export function encodeTeacherRole(roleType: "admin" | "teacher", students: string[]): string {
  if (roleType === "admin") {
    return "admin";
  }
  return JSON.stringify({
    role: "teacher",
    students: Array.from(new Set(students.filter(Boolean))),
  });
}

