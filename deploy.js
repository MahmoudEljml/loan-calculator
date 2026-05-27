import FtpDeploy from "ftp-deploy";
const ftpDeploy = new FtpDeploy();

const config = {
  user: "if0_41117872",
  password: "OG4uvSbip0I",
  host: "ftpupload.net",
  port: 21,
  // الحل هنا: نستخدم ./dist مباشرة بدلاً من __dirname
  localRoot: "./dist",
  remoteRoot: "/htdocs/", // المجلد في الاستضافة
  include: ["*", "**/*", ".htaccess"], // رفع كل الملفات
  deleteRemote: true, //  تمسح الملفات القديمة تلقائياً لتجنب مشاكل الـ PWA
  forcePasv: true, // مهم جداً للاستضافات المجانية لتجنب مشاكل الاتصال
  // استبعاد الملفات التي لا تريد مسحها من السيرفر (مثل ملفات الحماية)
  exclude: [".cpanel", ".softaculous"],
};

ftpDeploy
  .deploy(config)
  .then((res) => console.log("success", res))
  .catch((err) => console.log(err));
