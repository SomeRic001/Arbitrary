import { getTopUsers } from "./src/db/user-queries";

async function main() {
  const users = await getTopUsers(5);
  console.log("Top users:", users);
  process.exit(0);
}
main().catch(console.error);
