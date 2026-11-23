interface Props {
  code: string;
  highlightLine: number;
}

// Shows the submitted code with line numbers and the hinted line highlighted.
export default function CodeView({ code, highlightLine }: Props) {
  return (
    <pre className="code-view">
      {code.split("\n").map((text, i) => {
        const lineNo = i + 1;
        return (
          <div key={lineNo} className={lineNo === highlightLine ? "line highlighted" : "line"}>
            <span className="line-no">{lineNo}</span>
            <span>{text || " "}</span>
          </div>
        );
      })}
    </pre>
  );
}
