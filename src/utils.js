const fileInput = document.getElementById('file');
const urlInput = document.getElementById('url');
const resultArea = document.getElementById('result');
const delaySelect = document.getElementById('delay');
const button = document.getElementById('send');
const loader = document.createElement('a');
loader.classList = "loader small white";
const result = [];
function sendData() {
    const file = fileInput.files[0];

    if (!file) {
        alert('File is required');
        return false;
    }

    switch (file.type) {
        // case 'text/csv':
        //     break;
        case 'application/json':
            var reader = new FileReader();
            reader.onload = function () {
                var text = reader.result;
                fetchHandler(JSON.parse(text));
            };
            reader.readAsText(file);

            break;
        default:
            alert('The file must be a valid json.');
            return false;
    }

    toggleButton();
}

async function fetchHandler(data) {
    if (!Array.isArray(data)) {
        data = [data];
    }

    var i = 0;
    for (piece of data) {
        await delayFetch(urlInput.value, {
            delay: delaySelect.value*1000,
            method: "POST",
            body: JSON.stringify(piece),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
        })
            .then((response) => response.json())
            .then((json) => {
                result.push(json);
                i++;
                ui("#progress", i * 100 / data.length);
                resultArea.value = JSON.stringify(result, null, 4)
            });
    }

    toggleButton();
}

function delayFetch(url, options) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(fetch(url, options));
        }, options.delay);
    });
}

function toggleButton() {
    if (button.hasAttribute('disabled')) {
        button.removeAttribute('disabled')
        button.removeChild(loader)
        setTimeout(() => {
            ui("#progress", 0);
        }, 2000);
    } else {
        button.setAttribute('disabled', 'disabled')
        button.appendChild(
            loader
        );
    }
}

function download() {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 4)));
    element.setAttribute('download', 'result.json');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}