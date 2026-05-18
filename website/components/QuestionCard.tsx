interface QuestionProps {
  question: {
    question_id: string
    question: string
    context?: string
    question_type?: 'text_only' | 'text_image' | 'image_only' | 'chokai'
    choices: Array<{ text: string; image?: { url: string; path: string } }>
    images: Array<{ url: string; path: string; index: number }>
    audio: string
    audio_url?: string
    correctAnswer?: string | number
  }
  selectedAnswer: number
  onSelectAnswer: (index: number) => void
  submitted: boolean
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  submitted,
}: QuestionProps) {
  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    const filename = imagePath.split('/').pop() || imagePath
    return `/images/${filename}`
  }

  const getAudioUrl = (audioPath: string) => {
    if (audioPath.startsWith('http')) {
      return audioPath
    }
    const filename = audioPath.includes('/') ? audioPath.split('/').pop() : audioPath
    return `/audio/${filename}`
  }

  const getAudioSourceTypes = (audioPath: string) => {
    const sourceUrl = getAudioUrl(audioPath)
    const lowerPath = audioPath.toLowerCase()

    if (lowerPath.endsWith('.mp4')) {
      return [
        { src: sourceUrl, type: 'audio/mp4' },
        { src: sourceUrl, type: 'video/mp4' },
      ]
    }

    if (lowerPath.endsWith('.m4a')) {
      return [{ src: sourceUrl, type: 'audio/mp4' }]
    }

    if (lowerPath.endsWith('.wav')) {
      return [{ src: sourceUrl, type: 'audio/wav' }]
    }

    if (lowerPath.endsWith('.ogg')) {
      return [{ src: sourceUrl, type: 'audio/ogg' }]
    }

    if (lowerPath.endsWith('.webm')) {
      return [{ src: sourceUrl, type: 'audio/webm' }]
    }

    if (lowerPath.endsWith('.aac')) {
      return [{ src: sourceUrl, type: 'audio/aac' }]
    }

    return [{ src: sourceUrl, type: 'audio/mpeg' }]
  }

  const isChoiceCorrect = (idx: number) => {
    if (question.correctAnswer === undefined) return false
    if (typeof question.correctAnswer === 'number') {
      return idx === question.correctAnswer
    }
    return question.choices[idx]?.text === question.correctAnswer
  }

  const audioSourcePath = question.audio || question.audio_url || ''
  const hasAudio = Boolean(audioSourcePath)

  return (
    <div className="space-y-6 md:space-y-7">
      <div className="rounded-[30px] border border-slate-900/8 bg-[color:var(--surface)] p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.6)] backdrop-blur-sm md:p-7">
        <div className="mb-4 inline-flex rounded-full border border-slate-900/8 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
          Prompt
        </div>

        {question.context && (
          <div className="mb-4 rounded-[18px] border border-slate-200/70 bg-slate-50/80 px-4 py-3">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Konteks</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{question.context}</p>
          </div>
        )}

        <h2 className="whitespace-pre-line font-display text-2xl font-bold leading-[1.15] tracking-[-0.05em] text-slate-950 md:text-[2rem]">
          {question.question || (question.images?.length > 0 ? '(Image Question)' : 'No Question Text')}
        </h2>

        {question.images && question.images.length > 0 && (
          <div className="mt-6 space-y-4">
            {question.images.map((img, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-[24px] border border-slate-900/8 bg-white/90 p-2 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.55)]"
              >
                <img
                  src={getImageUrl(img.path)}
                  alt={`Question image ${idx + 1}`}
                  className="choice-image mx-auto max-h-80 w-full rounded-[18px] object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement
                    const wrapper = img.closest('.overflow-hidden') as HTMLElement | null
                    if (wrapper) wrapper.style.display = 'none'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {hasAudio && (
          <div className="mt-6 overflow-hidden rounded-[28px] border border-sky-200/70 bg-[linear-gradient(135deg,rgba(91,168,255,0.16),rgba(255,255,255,0.82))] p-5 shadow-[0_18px_40px_-32px_rgba(59,130,246,0.45)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-slate-900 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.983 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-800">Listening Audio</p>
                <p className="mt-1 text-sm text-slate-600">Putar audio dulu, lalu pilih jawaban yang paling tepat.</p>
              </div>
            </div>

            <audio controls preload="metadata" className="block w-full max-w-full rounded-[18px]">
              {getAudioSourceTypes(audioSourcePath).map((source) => (
                <source key={`${source.src}-${source.type}`} src={source.src} type={source.type} />
              ))}
              Browser Anda tidak mendukung pemutar audio.
            </audio>

            <p className="mt-3 text-[11px] italic text-sky-700/75">
              Putar file audio di sini. File MP4 tetap diperlakukan sebagai audio.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 md:space-y-4">
        <p className="px-1 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 md:text-xs">
          Pilihan Jawaban
        </p>

        {question.choices.map((choice, idx) => {
          const isSelected = selectedAnswer === idx
          const isCorrect = isChoiceCorrect(idx)

          let borderColor = 'border-slate-900/10'
          let bgColor = 'bg-white/88 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.55)]'
          let markerColor = 'bg-slate-900/5 text-slate-600'

          if (submitted) {
            if (isCorrect) {
              borderColor = 'border-emerald-400'
              bgColor = 'bg-emerald-50'
              markerColor = 'bg-emerald-500 text-white'
            } else if (isSelected && !isCorrect) {
              borderColor = 'border-red-400'
              bgColor = 'bg-red-50'
              markerColor = 'bg-red-500 text-white'
            }
          } else if (isSelected) {
            borderColor = 'border-[#4f7cff]'
            bgColor = 'bg-[#dcecff] ring-1 ring-[#4f7cff]/35'
            markerColor = 'bg-[#101828] text-white'
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectAnswer(idx)}
              disabled={submitted}
              className={`w-full overflow-hidden rounded-[26px] border p-4 text-left transition-all duration-200 active:scale-[0.985] md:p-5 ${borderColor} ${bgColor} ${submitted ? 'cursor-default' : 'cursor-pointer hover:-translate-y-0.5 hover:border-slate-400/30 hover:bg-white'}`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 shrink-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-[14px] text-xs font-black transition-colors md:h-10 md:w-10 ${markerColor} ${
                      submitted && !isCorrect && !isSelected ? 'opacity-55' : ''
                    }`}
                  >
                    {submitted && isCorrect ? '✓' : submitted && isSelected && !isCorrect ? '✕' : String.fromCharCode(65 + idx)}
                  </div>
                </div>

                <div className="flex-1">
                  {choice.image && (
                    <div className="mb-3 overflow-hidden rounded-[18px] border border-slate-900/8 bg-[color:var(--surface-soft)] p-1.5">
                      <img
                        src={getImageUrl(choice.image.path)}
                        alt={`Choice ${idx + 1}`}
                        className="choice-image mx-auto h-32 w-auto rounded-[14px] object-contain md:h-40"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          if (img.parentElement) img.parentElement.style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  {choice.text && (
                    <p
                      className={`text-sm font-semibold leading-6 md:text-base ${
                        submitted && isCorrect
                          ? 'text-emerald-900'
                          : submitted && isSelected && !isCorrect
                            ? 'text-red-900'
                            : isSelected
                              ? 'text-[#101828]'
                              : 'text-slate-800'
                      }`}
                    >
                      {choice.text}
                    </p>
                  )}

                  {!choice.text && choice.image && (
                    <p className="text-xs italic text-slate-400 md:text-sm">(Pilihan Gambar)</p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
