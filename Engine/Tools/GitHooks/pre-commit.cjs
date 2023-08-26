const { execSync } = require('child_process');
const fs = require('fs');

const files = execSync('git diff --cached --name-only --diff-filter=ACM')
  .toString()
  .split('\n')
  .filter(
    (file) =>
      (file.startsWith('Engine/') && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) &&
      !file.includes('precommit.js') // Exclude the precommit.js script itself
  )
  .map((file) => "../../" + file) // Navigate out of tools/GitHooks!
  .filter((file) => fs.existsSync(file)); // Ensure the file exists

console.log("Formatting " + files.length + " files");
files.forEach((file) => {
  try {
    execSync(`npx prettier --write ${file}`);
    execSync(`git add ${file}`);
  } catch {
    console.error("precommit Prettier failed");
    process.exit(1);
  }
});
