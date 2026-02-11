(function () {
    'use strict';

    var QUIZ_HOST = '__QUIZ_HOST__';

    function QuizEmbed(options) {
        if (!options || !options.quizId) {
            console.error('QuizEmbed: quizId is required');
            return;
        }

        this.quizId = options.quizId;
        this.mode = options.mode || 'inline';
        this.containerId = options.containerId || null;
        this.buttonText = options.buttonText || 'Lancer le quiz';
        this.width = options.width || '100%';
        this.height = options.height || '600px';
        this.onComplete = options.onComplete || null;

        this._init();
    }

    QuizEmbed.prototype._getQuizUrl = function () {
        return QUIZ_HOST + '/q/' + this.quizId;
    };

    QuizEmbed.prototype._createIframe = function () {
        var iframe = document.createElement('iframe');
        iframe.src = this._getQuizUrl();
        iframe.style.width = this.width;
        iframe.style.height = this.height;
        iframe.style.border = 'none';
        iframe.style.borderRadius = '12px';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('title', 'Quiz');
        return iframe;
    };

    QuizEmbed.prototype._init = function () {
        var self = this;

        window.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'quiz-resize') {
                var iframes = document.querySelectorAll('iframe');
                for (var i = 0; i < iframes.length; i++) {
                    if (iframes[i].src.indexOf(self.quizId) !== -1) {
                        iframes[i].style.height = (event.data.height + 40) + 'px';
                    }
                }
            }

            if (event.data && event.data.type === 'quizCompleted' && event.data.quizId === self.quizId) {
                if (typeof self.onComplete === 'function') {
                    self.onComplete({
                        quizId: event.data.quizId,
                        score: event.data.score,
                        total: event.data.total,
                    });
                }
            }
        });

        if (this.mode === 'inline') {
            this._initInline();
        } else if (this.mode === 'modal') {
            this._initModal();
        }
    };

    QuizEmbed.prototype._initInline = function () {
        var container = document.getElementById(this.containerId);
        if (!container) {
            console.error('QuizEmbed: container not found: ' + this.containerId);
            return;
        }
        container.appendChild(this._createIframe());
    };

    QuizEmbed.prototype._initModal = function () {
        var self = this;

        var button = document.createElement('button');
        button.textContent = this.buttonText;
        button.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;padding:10px 20px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;';

        var overlay = document.createElement('div');
        overlay.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;align-items:center;justify-content:center;';

        var modal = document.createElement('div');
        modal.style.cssText = 'background:white;border-radius:12px;width:90%;max-width:800px;max-height:90vh;overflow:hidden;position:relative;';

        var closeBtn = document.createElement('button');
        closeBtn.textContent = '\u00D7';
        closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;background:none;border:none;font-size:24px;cursor:pointer;color:#6b7280;z-index:1;width:32px;height:32px;display:flex;align-items:center;justify-content:center;';

        var iframe = this._createIframe();
        iframe.style.width = '100%';
        iframe.style.height = '80vh';

        modal.appendChild(closeBtn);
        modal.appendChild(iframe);
        overlay.appendChild(modal);

        button.addEventListener('click', function () {
            overlay.style.display = 'flex';
        });

        closeBtn.addEventListener('click', function () {
            overlay.style.display = 'none';
        });

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });

        if (this.containerId) {
            var container = document.getElementById(this.containerId);
            if (container) {
                container.appendChild(button);
            }
        } else {
            document.currentScript && document.currentScript.parentNode
                ? document.currentScript.parentNode.appendChild(button)
                : document.body.appendChild(button);
        }

        document.body.appendChild(overlay);
    };

    window.QuizEmbed = QuizEmbed;
})();
