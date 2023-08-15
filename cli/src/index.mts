import inquirer from "inquirer";
import figlet from "figlet";
import path from "path";

console.log(figlet.textSync("ApolloTV"));
console.log("\n");

const getExtension = (type: string, extension: string) => {
  return path.join(__dirname, "../../src", `/extensions/${type}/${extension}`);
};

(async () => {
  const answers = await inquirer.prompt([
    {
      name: "type",
      message: "What type of extension do you want to test",
      type: "list",
      choices: [
        {
          name: "anime",
          value: "anime",
          type: "choice",
        },

        {
          name: "movie",
          value: "movie",
          type: "choice",
        },
      ],
    },
    {
      name: "extension",
      message: "What extension do you want to test",
    },
  ]);
})();
