const { ref } = Vue
export default {
    setup() {
        const file = ref();
        const url = ref();
        const sending = ref(false);
        const result = ref([]);
        const canceled = ref(false);
        const delaySelect = ref(2);
        const downloaded = ref(false);
        const resultArea = ref('');
        const current = ref(0);
        const total = ref(0);
        const status = ref('');
        var startTime = null;
        const popupOpen = ref(false);
        function resetStatus() {
            status.value = '0/0 remaining: 0 sec. elapsed: 0 sec.';
        }
        resetStatus();
        function sendData() {
            if (!popupOpen.value && result.value.length > 0 && !downloaded.value) {
                checkPreviousData();
            } else {
                if (!file.value) {
                    ui("#toast-required", 2000);
                    return false;
                }

                sending.value = true;

                switch (file.value.type) {
                    // case 'text/csv':
                    //     break;
                    case 'application/json':
                        var reader = new FileReader();
                        reader.onload = function () {
                            var text = reader.result;
                            fetchHandler(JSON.parse(text));
                        };
                        reader.readAsText(file.value);

                        break;
                    default:
                        ui("#toast-warn", 2000);
                        return false;
                }

                ui("#progress", 0);
            }
        }

        function showStatus(done, total) {
            if (done > total) return;

            if (startTime == null) startTime = new Date();

            var now = new Date();

            var rate = (now - startTime) / done;
            var left = total - done;
            var eta = round(rate * left, 2);
            var elapsed = now - startTime

            if (isNaN(eta)) {
                eta = 0;
            }

            status.value = `${done}/${total} remaining: ${round(eta / 1000, 2)} sec. elapsed: ${round(elapsed / 1000, 2)} sec.`;
            console.log((new Date()).getTime());
        }

        function round(value, digits) {
            if (!digits) {
                digits = 2;
            }

            value = value * Math.pow(10, digits);
            value = Math.round(value);
            value = value / Math.pow(10, digits);

            return value
        }

        function checkPreviousData() {
            popupOpen.value = true;
        }

        async function fetchHandler(data) {
            if (!Array.isArray(data)) {
                data = [data];
            }

            var i = 0;
            total.value = data.length
            for (var piece of data) {
                if (!canceled.value) {
                    await delayFetch(url.value, {
                        delay: delaySelect.value * 1000,
                        method: "POST",
                        body: JSON.stringify(piece),
                        headers: {
                            "Content-type": "application/json; charset=UTF-8",
                        },
                    })
                        .then((response) => {
                            response.json().then((json) => {
                                result.value.push(json);
                                i++;
                                current.value++;
                                showStatus(current.value, total.value);
                                ui("#progress", i * 100 / data.length);
                                resultArea.value = JSON.stringify(result.value, null, 4)
                                resultArea.value = hljs.highlight(resultArea.value, { language: 'json' }).value;
                            }) || false });
                }
            }
            startTime = null;
            sending.value = false;
            if (!canceled.value) {
                ui("#toast-done", 1500);
            } else {
                ui("#toast-info", 1500);
            }
            canceled.value = false;
        }

        function delayFetch(url, options) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    try {
                        resolve(fetch(url, options));
                    } catch (e) {
                        ui("#toast-warn", 2000);
                    }
                }, options.delay);
            });
        }

        function toggleButton() {
            if (sendButton.hasAttribute('disabled')) {
                sendButton.removeAttribute('disabled')
                urlInput.removeAttribute('disabled')
                fileTextInput.removeAttribute('disabled')
                fileInput.style = '';
                // cancelButton.setAttribute('disabled', 'disabled')
                document.getElementById('icon').style = '';
                sendButton.removeChild(loader)
                setTimeout(() => {

                }, 2000);
            } else {
                // sendButton.setAttribute('disabled', 'disabled')
                // urlInput.setAttribute('disabled', 'disabled')
                // fileTextInput.setAttribute('disabled', 'disabled')
                fileInput.style = 'display: none';
                cancelButton.removeAttribute('disabled');
                document.getElementById('icon').style = 'display: none';
                sendButton.appendChild(loader);
            }
        }

        function cancel() {
            // ui("#toast-cancel", 1500);
            canceled.value = true;
        }

        function download() {
            var element = document.createElement('a');
            
            element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result.value, null, 4)));
            element.setAttribute('download', 'result.json');
            
            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
            downloaded.value = true;
            deleteLog()
        }

        function deleteLog() {
            result.value = [];
            resultArea.value = '';
            downloaded.value = false;
            current.value = 0;
            total.value = 0;
            popupOpen.value = false;
            resetStatus();
        }

        window.electronAPI.toggleTheme((event, theme) => {
            switch (theme) {
                case 1:
                    ui('mode', 'dark');
                    document.getElementById('code-sheet').href = './src/highlight/styles/dark.min.css';
                    break;
                case 2:
                    ui('mode', 'light');
                    document.getElementById('code-sheet').href = './src/highlight/styles/default.min.css';
                    break;
            }
        })

        function toggleLabel() {
            if (labelResult.className == 'active') {
                labelResult.className = '';
            } else {
                labelResult.className = 'active';
            }
        }
        return {
            sending,
            file,
            url,
            result,
            downloaded,
            delaySelect,
            resultArea,
            current,
            total,
            status,
            popupOpen,
            cancel,
            download,
            sendData,
            deleteLog
        };
    },
    template: /*html*/`<div>
            <main class="responsive" style="min-height: 85vh;">
            <div class="field label fill large s12">
                <input id="url" type="url" v-model="url" :disabled="sending">
                <label>URL</label>
            </div>
            <div class="field label suffix fill large s12">
                <input id="file" type="file" accept="application/json" @input="file = $event.target.files[0]" :disabled="sending">
                <input id="fileText" type="text" :disabled="sending">
                <label>File</label>
                <i>attach_file</i>
            </div>

            <article class="fill scroll code-block">
                <pre class="reset"><code class="json" style="background-color: unset;" id="result" v-html="resultArea"></code></pre>
                <footer class="fixed custom-footer">
                    <p style="margin: 8px;">{{status}}</p>
                    <div>
                        <button id="download" class="transparent circle" @click="download" :disabled="result.length == 0">
                            <i>download</i>
                        </button>
                        <button id="delete" class="transparent circle" @click="deleteLog" :disabled="result.length == 0">
                            <i>delete</i>
                        </button>
                    </div>
                </footer>
            </article>
        </main>
        <div class="overlay blur" :class="{'active': popupOpen}"></div>
        <dialog id="download-popup" :class="{'active': popupOpen}">
            <h5>Log not downloaded</h5>
            <div>Do you want to download the current log?</div>
            <nav class="right-align no-space">
                <button class="transparent link" @click="deleteLog">Cancel</button>
                <button class="transparent link" @click="download">Download</button>
            </nav>
        </dialog>
        <div class="snackbar pink white-text">
            <i>error</i>
            <span>Some text here</span>
        </div>
        <div id="toast-warn" class="snackbar orange white-text">
            <i>warning</i>
            <span>The file must be a valid json.</span>
        </div>
        <div id="toast-required" class="snackbar orange white-text">
            <i>warning</i>
            <span>File is required.</span>
        </div>
        <div id="toast-done" class="snackbar green white-text">
            <i>done</i>
            <span>Everyting is done!</span>
        </div>
        <div id="toast-info" class="snackbar blue white-text">
            <i>info</i>
            <span>Canceled!</span>
        </div>
        <footer class="fill">
            <nav>
                <div class="field label suffix extra">
                    <select v-model="delaySelect">
                        <option v-for="item in [2,3,4,5,6,7,8,9,10]" :value="item" :selected="item == 2">{{item}}</option>
                    </select>
                    <label>Delay</label>
                    <i>arrow_drop_down</i>
                </div>
                <div class="max"></div>
                <button class="small-round error extra"  id="cancel" @click="cancel" :disabled="!sending">
                    <span>Cancelar</span>
                    <i>cancel</i>
                </button>
                <button class="small-round tertiary extra" id="send" @click="sendData" :disabled="sending">
                    <div class="progress left light-green" id="progress"></div>
                    <span>Send</span>
                    <i id="icon" v-if="!sending">send</i>
                    <progress class="circle small" v-if="sending"></progress>
                </button>
            </nav>
        </footer>
    </div>`
}