import { readFile } from "fs/promises";

interface GetDbStatusArgs {
  machine: string;
}

export const checkLocalJsonFile = async ({ machine }: GetDbStatusArgs) => {
  console.log("MACHINE INPUT:", machine);
  const filePath = "../../../mcp-data.json";
  let jsonData;
  try {
    const fileContent = await readFile(filePath, "utf-8");
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Failed to load JSON file for machine ${machine}:`, error);
  }

  const filteredData = Array.isArray(jsonData)
    ? jsonData.filter((item) => item.sserial_no === machine)
    : [];

  return filteredData;
};
