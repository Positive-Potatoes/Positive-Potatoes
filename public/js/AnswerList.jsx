import AnswerListEntry from './AnswerListEntry.jsx'

const AnswerList = ({answers}) => (
  <div>
    {answers.map((answer, i) =>
      <AnswerListEntry answer={answer} key={i} />
    )}
  </div>
);

export default AnswerList