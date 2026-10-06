import { Panel, Section } from "./shared";

export function About() {
  return (
    <Section title="About this project">
      <Panel className="grid gap-6 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <p><strong>Project title:</strong> AI-Powered Sentiment Analysis Dashboard</p>
          <p><strong>Theme:</strong> AI for Data Analysis &amp; Insights</p>
          <div><strong>Core competencies</strong>
            <ul className="mt-1 list-disc pl-5"><li>Data interpretation using AI</li><li>Analytical thinking</li><li>AI-assisted insights generation</li><li>Individual project ownership</li></ul>
          </div>
          <div><strong>Technical concepts</strong>
            <ul className="mt-1 list-disc pl-5"><li>Sentiment analysis</li><li>Text classification</li><li>Basic machine learning</li><li>Data visualisation</li></ul>
          </div>
        </div>
        <div className="space-y-3">
          <strong>How it works</strong>
          <ol className="list-decimal space-y-1 pl-5">
            <li><b>Collect</b> — text typed in or rows from an uploaded CSV.</li>
            <li><b>Clean</b> — HTML, links and control characters removed, whitespace collapsed, empty rows skipped. The original text is kept.</li>
            <li><b>Analyse &amp; classify</b> — a pretrained large language model (Google Gemini) acts as a zero-shot text classifier, returning Positive / Negative / Neutral, a confidence and a reason.</li>
            <li><b>Calculate</b> — counts and percentages computed in the browser.</li>
            <li><b>Visualise</b> — distribution, comparison and time-trend charts.</li>
            <li><b>Insights</b> — word frequencies (tokenised, stop-words removed) plus an AI-written interpretation.</li>
          </ol>
          <p className="text-muted-foreground">Results are stored in your browser for this device only.</p>
        </div>
      </Panel>
    </Section>
  );
}
