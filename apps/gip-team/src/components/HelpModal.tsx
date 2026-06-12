interface Props {
  appMode: 'gallery' | 'agent'
  onClose: () => void
}

function StepList({ items }: { items: string[] }) {
  return <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">{items.map((item) => <li key={item}>{item}</li>)}</ol>
}

function BulletList({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">{items.map((item) => <li key={item}>{item}</li>)}</ul>
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">生图操作指南</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">这里保留核心生图、参考图和遮罩编辑流程。</p>
          </div>
          <button className="rounded-xl px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]" onClick={onClose}>关闭</button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 p-4 dark:border-white/[0.08]">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">基础生图</h3>
            <StepList items={["在底部输入框描述要生成的画面。", "按需上传参考图或绘制遮罩。", "点击生成图像，完成后在历史列表查看结果。"]} />
          </section>
          <section className="rounded-2xl border border-gray-200 p-4 dark:border-white/[0.08]">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">小技巧</h3>
            <BulletList items={["提示词越具体，结果越稳定。", "参考图适合控制主体、风格和构图。", "遮罩编辑适合局部改图。"]} />
          </section>
        </div>
      </div>
    </div>
  )
}
