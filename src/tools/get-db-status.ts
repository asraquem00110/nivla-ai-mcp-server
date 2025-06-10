
interface GetDbStatusArgs {
  machine: string
}

export const getDbStatus = async ({machine}: GetDbStatusArgs)=> {
   console.log(machine);
      return {
        content: [
          {
            type: "text",
            text: "Machine status is active",
          },
        ],
      };
}