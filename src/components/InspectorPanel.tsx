// Residential Wiring Simulator v2.2
// Apprentice Inspector Display

import { InspectionResult } from "../electrical/inspector";


interface InspectorPanelProps {

  result?: InspectionResult;

}


export default function InspectorPanel({
  result
}: InspectorPanelProps) {


  if (!result) {

    return (

      <div className="inspector-panel">

        <h3>
          Electrical Inspector
        </h3>

        <p>
          No circuit selected.
        </p>

      </div>

    );

  }


  return (

    <div className="inspector-panel">

      <h3>
        Electrical Inspector
      </h3>


      <h4>
        {result.summary}
      </h4>


      {
        result.issues.length > 0 && (

          <div>

            <h4>
              ❌ Issues
            </h4>

            <ul>

              {
                result.issues.map(
                  (issue, index) => (

                    <li key={index}>
                      {issue}
                    </li>

                  )
                )
              }

            </ul>

          </div>

        )
      }



      {
        result.warnings.length > 0 && (

          <div>

            <h4>
              ⚠ Warnings
            </h4>

            <ul>

              {
                result.warnings.map(
                  (warning, index) => (

                    <li key={index}>
                      {warning}
                    </li>

                  )
                )
              }

            </ul>

          </div>

        )
      }



      {
        result.passed && (

          <p>
            ✓ Ready for inspection approval
          </p>

        )
      }


    </div>

  );

}