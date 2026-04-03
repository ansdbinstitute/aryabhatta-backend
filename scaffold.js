const fs = require('fs');
const path = require('path');

const apis = {
  course: {
    kind: "collectionType",
    collectionName: "courses",
    info: { singularName: "course", pluralName: "courses", displayName: "Course" },
    options: { draftAndPublish: false },
    attributes: {
      title: { type: "string", required: true },
      code: { type: "string", required: true, unique: true },
      description: { type: "text" },
      durationValue: { type: "integer", required: true },
      durationUnit: { type: "enumeration", enum: ["days", "weeks", "months", "years"], required: true },
      totalFees: { type: "decimal", required: true },
      isActive: { type: "boolean", default: true },
      sortOrder: { type: "integer", default: 0 },
      batches: { type: "relation", relation: "oneToMany", target: "api::batch.batch", mappedBy: "course" }
    }
  },
  batch: {
    kind: "collectionType",
    collectionName: "batches",
    info: { singularName: "batch", pluralName: "batches", displayName: "Batch" },
    options: { draftAndPublish: false },
    attributes: {
      name: { type: "string", required: true },
      startDate: { type: "date", required: true },
      endDate: { type: "date", required: true },
      capacity: { type: "integer", default: 30 },
      status: { type: "enumeration", enum: ["upcoming", "ongoing", "completed"], default: "upcoming" },
      course: { type: "relation", relation: "manyToOne", target: "api::course.course", inversedBy: "batches" },
      teacher: { type: "relation", relation: "manyToOne", target: "plugin::users-permissions.user" },
      students: { type: "relation", relation: "oneToMany", target: "api::student.student", mappedBy: "batch" }
    }
  },
  student: {
    kind: "collectionType",
    collectionName: "students",
    info: { singularName: "student", pluralName: "students", displayName: "Student" },
    options: { draftAndPublish: false },
    attributes: {
      firstName: { type: "string", required: true },
      lastName: { type: "string", required: true },
      uid: { type: "string", unique: true },
      dob: { type: "date", required: true },
      gender: { type: "enumeration", enum: ["male", "female", "other"] },
      fatherName: { type: "string" },
      motherName: { type: "string" },
      phone: { type: "string", required: true },
      altPhone: { type: "string" },
      email: { type: "email" },
      aadharNumber: { type: "string" },
      address: { type: "text", required: true },
      enrollmentDate: { type: "date", required: true },
      status: { type: "enumeration", enum: ["active", "completed", "dropped", "suspended"], default: "active" },
      profileImage: { type: "media", multiple: false, allowedTypes: ["images"] },
      user: { type: "relation", relation: "oneToOne", target: "plugin::users-permissions.user" },
      course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
      batch: { type: "relation", relation: "manyToOne", target: "api::batch.batch", inversedBy: "students" }
    }
  },
  attendance: {
    kind: "collectionType",
    collectionName: "attendances",
    info: { singularName: "attendance", pluralName: "attendances", displayName: "Attendance" },
    options: { draftAndPublish: false },
    attributes: {
      date: { type: "date", required: true },
      status: { type: "enumeration", enum: ["present", "absent", "late", "half_day"], required: true },
      remarks: { type: "string" },
      student: { type: "relation", relation: "manyToOne", target: "api::student.student" },
      batch: { type: "relation", relation: "manyToOne", target: "api::batch.batch" },
      markedBy: { type: "relation", relation: "manyToOne", target: "plugin::users-permissions.user" }
    }
  },
  "fee-structure": {
    kind: "collectionType",
    collectionName: "fee_structures",
    info: { singularName: "fee-structure", pluralName: "fee-structures", displayName: "Fee Structure" },
    options: { draftAndPublish: false },
    attributes: {
      title: { type: "string", required: true },
      amount: { type: "decimal", required: true },
      dueDate: { type: "date" },
      type: { type: "enumeration", enum: ["admission", "tuition", "exam", "other"], default: "tuition" },
      course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
      batch: { type: "relation", relation: "manyToOne", target: "api::batch.batch" }
    }
  },
  payment: {
    kind: "collectionType",
    collectionName: "payments",
    info: { singularName: "payment", pluralName: "payments", displayName: "Payment" },
    options: { draftAndPublish: false },
    attributes: {
      receiptNumber: { type: "string", unique: true },
      amount: { type: "decimal", required: true },
      paymentDate: { type: "date", required: true },
      paymentMethod: { type: "enumeration", enum: ["cash", "bank_transfer", "upi", "card"], required: true },
      referenceNumber: { type: "string" },
      status: { type: "enumeration", enum: ["pending", "completed", "failed", "refunded"], default: "completed" },
      student: { type: "relation", relation: "manyToOne", target: "api::student.student" },
      feeStructure: { type: "relation", relation: "manyToOne", target: "api::fee-structure.fee-structure" },
      recordedBy: { type: "relation", relation: "manyToOne", target: "plugin::users-permissions.user" }
    }
  },
  exam: {
    kind: "collectionType",
    collectionName: "exams",
    info: { singularName: "exam", pluralName: "exams", displayName: "Exam" },
    options: { draftAndPublish: false },
    attributes: {
      title: { type: "string", required: true },
      examDate: { type: "date", required: true },
      maxMarks: { type: "integer", required: true },
      passingMarks: { type: "integer", required: true },
      type: { type: "enumeration", enum: ["theory", "practical", "internal", "final"] },
      course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
      batch: { type: "relation", relation: "manyToOne", target: "api::batch.batch" }
    }
  },
  result: {
    kind: "collectionType",
    collectionName: "results",
    info: { singularName: "result", pluralName: "results", displayName: "Result" },
    options: { draftAndPublish: false },
    attributes: {
      marksObtained: { type: "decimal", required: true },
      grade: { type: "string" },
      remarks: { type: "text" },
      student: { type: "relation", relation: "manyToOne", target: "api::student.student" },
      exam: { type: "relation", relation: "manyToOne", target: "api::exam.exam" }
    }
  },
  notice: {
    kind: "collectionType",
    collectionName: "notices",
    info: { singularName: "notice", pluralName: "notices", displayName: "Notice" },
    options: { draftAndPublish: false },
    attributes: {
      title: { type: "string", required: true },
      content: { type: "richtext", required: true },
      publishDate: { type: "date", required: true },
      expiryDate: { type: "date" },
      targetRoles: { type: "json" }, 
      targetBatches: { type: "relation", relation: "manyToMany", target: "api::batch.batch" },
      attachments: { type: "media", multiple: true, allowedTypes: ["files", "images", "videos"] }
    }
  },
  material: {
    kind: "collectionType",
    collectionName: "materials",
    info: { singularName: "material", pluralName: "materials", displayName: "Study Material" },
    options: { draftAndPublish: false },
    attributes: {
      title: { type: "string", required: true },
      description: { type: "text" },
      type: { type: "enumeration", enum: ["document", "video", "link"] },
      url: { type: "string" },
      file: { type: "media", multiple: false, allowedTypes: ["files", "images", "videos"] },
      course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
      batch: { type: "relation", relation: "manyToOne", target: "api::batch.batch" },
      uploadedBy: { type: "relation", relation: "manyToOne", target: "plugin::users-permissions.user" }
    }
  },
  "institute-setting": {
    kind: "singleType",
    collectionName: "institute_settings",
    info: { singularName: "institute-setting", pluralName: "institute-settings", displayName: "Institute Settings" },
    options: { draftAndPublish: false },
    attributes: {
      instituteName: { type: "string", default: "Aryabhatta National Skill Development Board" },
      instituteCode: { type: "string", default: "ANSDB" },
      contactEmail: { type: "email" },
      contactPhone: { type: "string" },
      address: { type: "text" },
      logo: { type: "media", multiple: false, allowedTypes: ["images"] },
      currentAcademicYear: { type: "string", default: "2026-27" },
      receiptPrefix: { type: "string", default: "REC-" },
      studentUidFormat: { type: "string", default: "{INST}-{YEAR}-{COURSE}-{SEQ}" }
    }
  }
};

const baseDir = path.join(__dirname, 'src', 'api');

for (const [name, schema] of Object.entries(apis)) {
  const apiDir = path.join(baseDir, name);
  const contentTypesDir = path.join(apiDir, 'content-types', name);
  const controllersDir = path.join(apiDir, 'controllers');
  const routesDir = path.join(apiDir, 'routes');
  const servicesDir = path.join(apiDir, 'services');

  // Create directories
  fs.mkdirSync(contentTypesDir, { recursive: true });
  fs.mkdirSync(controllersDir, { recursive: true });
  fs.mkdirSync(routesDir, { recursive: true });
  fs.mkdirSync(servicesDir, { recursive: true });

  // 1. Write schema
  fs.writeFileSync(
    path.join(contentTypesDir, 'schema.json'),
    JSON.stringify(schema, null, 2)
  );

  // 2. Write controller
  const controllerTSContent = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreController('api::${name}.${name}');\n`;
  fs.writeFileSync(path.join(controllersDir, `${name}.ts`), controllerTSContent);

  // 3. Write routes
  const routesTSContent = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('api::${name}.${name}');\n`;
  fs.writeFileSync(path.join(routesDir, `${name}.ts`), routesTSContent);

  // 4. Write services
  const servicesTSContent = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('api::${name}.${name}');\n`;
  fs.writeFileSync(path.join(servicesDir, `${name}.ts`), servicesTSContent);
  
  console.log(`Scaffolded API: ${name}`);
}

console.log("All schemas generated successfully.");
