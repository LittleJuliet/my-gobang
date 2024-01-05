interface ModelParams {
    content: string;
    showCancel?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export const Model = (params: ModelParams) => {
    const { content, showCancel, onConfirm, onCancel } = params;
    const confirmCb = () => {
        onConfirm && onConfirm();
        const modelWrapper = document.querySelector('.model-wrapper');
        modelWrapper &&
            modelWrapper.parentNode &&
            modelWrapper.parentNode.removeChild(modelWrapper);
    };
    const cancelCb = () => {
        onCancel && onCancel();
        const modelWrapper = document.querySelector('.model-wrapper');
        modelWrapper &&
            modelWrapper.parentNode &&
            modelWrapper.parentNode.removeChild(modelWrapper);
    };
    // 请实现一个弹窗组件，通过插入到body来实现，需要展示content内容，有确认和取消按钮，点击确认按钮执行onConfirm，点击取消按钮执行onCancel
    const model = document.createElement('div');
    model.classList.add('model-wrapper');
    model.innerHTML = `
    <div class="model">
      <div class="model-content">${content}</div>
      <div class="model-btn">
        <button class="model-btn-confirm">确认</button>
        ${showCancel ? '<button class="model-btn-cancel">取消</button>' : ''}
      </div>
    </div>
  `;
    document.body.appendChild(model);
    const confirmBtn = document.querySelector('.model-btn-confirm');
    const cancelBtn = document.querySelector('.model-btn-cancel');
    confirmBtn && confirmBtn.addEventListener('click', confirmCb);
    cancelBtn && cancelBtn.addEventListener('click', cancelCb);
};
