import gradio as gr

def main():
    gr.Interface(
        fn=lambda: "mistake_note UI is running.",
        inputs=None,
        outputs="text",
        title="mistake_note",
        description="最小可用闭环：摄像头按需开启，错题卡收集与引导式复习。"
    ).launch()

if __name__ == "__main__":
    main()
