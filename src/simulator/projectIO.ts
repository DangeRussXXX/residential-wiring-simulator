export type ProjectData = {
  name: string;
  version: string;
  created: string;

  circuit: {
    components: unknown[];
    wires: unknown[];
  };
};



export function saveProject(
  data: ProjectData
) {

  const json =
    JSON.stringify(
      data,
      null,
      2
    );


  const blob =
    new Blob(
      [json],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement(
      "a"
    );


  link.href = url;

  link.download =
    `${data.name}.json`;


  document.body.appendChild(link);

  link.click();


  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}




export function openProject(
  callback: (
    project: ProjectData
  ) => void
) {

  const input =
    document.createElement(
      "input"
    );


  input.type = "file";

  input.accept =
    ".json";


  input.onchange = () => {

    const file =
      input.files?.[0];


    if (!file) return;


    const reader =
      new FileReader();


    reader.onload = () => {

      const project =
        JSON.parse(
          reader.result as string
        ) as ProjectData;


      callback(project);
    };


    reader.readAsText(file);

  };


  input.click();
}