document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // 기본 DOM 요소
    // =========================================================

    const imageInput = document.getElementById("imageInput");

    const originalCanvas =
        document.getElementById("originalCanvas");

    const resolutionCanvas =
        document.getElementById("resolutionCanvas");

    const dctCanvas =
        document.getElementById("dctCanvas");

    const originalCtx =
        originalCanvas.getContext("2d");

    const resolutionCtx =
        resolutionCanvas.getContext("2d");

    const dctCtx =
        dctCanvas.getContext("2d");


    const imageInfo =
        document.getElementById("imageInfo");

    const resolutionSlider =
        document.getElementById("resolutionSlider");

    const resolutionValue =
        document.getElementById("resolutionValue");

    const resolutionButton =
        document.getElementById("resolutionButton");

    const resolutionMSE =
        document.getElementById("resolutionMSE");


    const dctSlider =
        document.getElementById("dctSlider");

    const dctValue =
        document.getElementById("dctValue");

    const dctButton =
        document.getElementById("dctButton");

    const dctMSE =
        document.getElementById("dctMSE");

    const coefficientInfo =
        document.getElementById("coefficientInfo");

    const matrixContainer =
        document.getElementById("matrixContainer");


    let originalImage = null;


    // =========================================================
    // 이미지 업로드
    // =========================================================

    imageInput.addEventListener("change", function (event) {

        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {

            const img = new Image();

            img.onload = function () {

                originalImage = img;

                originalCanvas.width = img.width;
                originalCanvas.height = img.height;

                resolutionCanvas.width = img.width;
                resolutionCanvas.height = img.height;

                dctCanvas.width = img.width;
                dctCanvas.height = img.height;

                originalCtx.clearRect(
                    0,
                    0,
                    originalCanvas.width,
                    originalCanvas.height
                );

                originalCtx.drawImage(
                    img,
                    0,
                    0
                );

                resolutionCtx.clearRect(
                    0,
                    0,
                    resolutionCanvas.width,
                    resolutionCanvas.height
                );

                dctCtx.clearRect(
                    0,
                    0,
                    dctCanvas.width,
                    dctCanvas.height
                );

                imageInfo.textContent =
                    `이미지 크기: ${img.width} × ${img.height}px`;

                resolutionMSE.textContent = "-";
                dctMSE.textContent = "-";
                coefficientInfo.textContent = "-";

                matrixContainer.innerHTML =
                    "<p>이미지가 업로드되었습니다. DCT 실험을 실행하세요.</p>";
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    });


    // =========================================================
    // 슬라이더
    // =========================================================

    resolutionSlider.addEventListener("input", function () {

        resolutionValue.textContent =
            resolutionSlider.value + "%";
    });


    dctSlider.addEventListener("input", function () {

        dctValue.textContent =
            dctSlider.value + "%";
    });


    // =========================================================
    // MSE 계산
    // =========================================================

    function calculateMSE(originalData, resultData) {

        let sum = 0;

        const length = originalData.data.length;

        for (let i = 0; i < length; i += 4) {

            const r1 = originalData.data[i];
            const g1 = originalData.data[i + 1];
            const b1 = originalData.data[i + 2];

            const r2 = resultData.data[i];
            const g2 = resultData.data[i + 1];
            const b2 = resultData.data[i + 2];

            sum += Math.pow(r1 - r2, 2);
            sum += Math.pow(g1 - g2, 2);
            sum += Math.pow(b1 - b2, 2);
        }

        const pixelCount =
            originalData.width *
            originalData.height *
            3;

        return sum / pixelCount;
    }


    // =========================================================
    // 해상도 축소 실험
    // =========================================================

    function runResolutionExperiment() {

        if (!originalImage) {
            alert("먼저 이미지를 업로드하세요.");
            return;
        }

        const ratio =
            Number(resolutionSlider.value) / 100;

        const width =
            originalCanvas.width;

        const height =
            originalCanvas.height;


        const originalData =
            originalCtx.getImageData(
                0,
                0,
                width,
                height
            );


        // 축소된 임시 캔버스
        const smallCanvas =
            document.createElement("canvas");

        const smallWidth =
            Math.max(1, Math.round(width * ratio));

        const smallHeight =
            Math.max(1, Math.round(height * ratio));

        smallCanvas.width = smallWidth;
        smallCanvas.height = smallHeight;


        const smallCtx =
            smallCanvas.getContext("2d");


        // 원본 → 축소
        smallCtx.drawImage(
            originalImage,
            0,
            0,
            smallWidth,
            smallHeight
        );


        // 축소 → 원래 크기
        resolutionCtx.clearRect(
            0,
            0,
            width,
            height
        );

        resolutionCtx.drawImage(
            smallCanvas,
            0,
            0,
            smallWidth,
            smallHeight,
            0,
            0,
            width,
            height
        );


        const resultData =
            resolutionCtx.getImageData(
                0,
                0,
                width,
                height
            );


        const mse =
            calculateMSE(
                originalData,
                resultData
            );


        resolutionMSE.textContent =
            mse.toFixed(2);
    }


    // =========================================================
    // DCT용 8×8 코사인 테이블
    // =========================================================

    const cosTable = [];

    for (let x = 0; x < 8; x++) {

        cosTable[x] = [];

        for (let u = 0; u < 8; u++) {

            cosTable[x][u] =
                Math.cos(
                    ((2 * x + 1) * u * Math.PI) / 16
                );
        }
    }


    // =========================================================
    // 8×8 DCT
    // =========================================================

    function DCT(block) {

        const result = [];

        for (let u = 0; u < 8; u++) {

            result[u] = [];

            for (let v = 0; v < 8; v++) {

                let sum = 0;

                for (let y = 0; y < 8; y++) {

                    for (let x = 0; x < 8; x++) {

                        sum +=
                            block[y][x] *
                            cosTable[x][u] *
                            cosTable[y][v];
                    }
                }

                const Cu =
                    u === 0
                        ? 1 / Math.sqrt(2)
                        : 1;

                const Cv =
                    v === 0
                        ? 1 / Math.sqrt(2)
                        : 1;


                result[u][v] =
                    0.25 *
                    Cu *
                    Cv *
                    sum;
            }
        }

        return result;
    }


    // =========================================================
    // 8×8 IDCT
    // =========================================================

    function IDCT(coefficients) {

        const result = [];

        for (let y = 0; y < 8; y++) {

            result[y] = [];

            for (let x = 0; x < 8; x++) {

                let sum = 0;

                for (let u = 0; u < 8; u++) {

                    for (let v = 0; v < 8; v++) {

                        const Cu =
                            u === 0
                                ? 1 / Math.sqrt(2)
                                : 1;

                        const Cv =
                            v === 0
                                ? 1 / Math.sqrt(2)
                                : 1;


                        sum +=
                            Cu *
                            Cv *
                            coefficients[u][v] *
                            cosTable[x][u] *
                            cosTable[y][v];
                    }
                }


                result[y][x] =
                    0.25 * sum;
            }
        }

        return result;
    }


    // =========================================================
    // Zigzag 순서
    // =========================================================

    function getZigzagOrder() {

        const order = [];

        for (let sum = 0; sum <= 14; sum++) {

            if (sum % 2 === 0) {

                for (let i = 0; i <= sum; i++) {

                    const row = sum - i;
                    const col = i;

                    if (
                        row < 8 &&
                        col < 8
                    ) {
                        order.push([row, col]);
                    }
                }

            } else {

                for (let i = 0; i <= sum; i++) {

                    const row = i;
                    const col = sum - i;

                    if (
                        row < 8 &&
                        col < 8
                    ) {
                        order.push([row, col]);
                    }
                }
            }
        }

        return order;
    }


    const zigzagOrder =
        getZigzagOrder();


    // =========================================================
    // DCT 실험
    // =========================================================

    function runDCTExperiment() {

        if (!originalImage) {
            alert("먼저 이미지를 업로드하세요.");
            return;
        }


        const keepPercent =
            Number(dctSlider.value);


        const width =
            originalCanvas.width;

        const height =
            originalCanvas.height;


        const originalData =
            originalCtx.getImageData(
                0,
                0,
                width,
                height
            );


        const outputData =
            new ImageData(
                width,
                height
            );


        const keepCount =
            Math.round(
                64 * keepPercent / 100
            );


        coefficientInfo.textContent =
            `${keepCount} / 64개`;


        // -----------------------------------------------------
        // 이미지의 모든 8×8 블록 처리
        // -----------------------------------------------------

        for (
            let blockY = 0;
            blockY < height;
            blockY += 8
        ) {

            for (
                let blockX = 0;
                blockX < width;
                blockX += 8
            ) {


                // R / G / B 채널
                const channels = [
                    [],
                    [],
                    []
                ];


                // -------------------------------------------------
                // 8×8 블록 생성
                // -------------------------------------------------

                for (let channel = 0; channel < 3; channel++) {

                    for (let y = 0; y < 8; y++) {

                        channels[channel][y] = [];

                        for (let x = 0; x < 8; x++) {

                            const px =
                                Math.min(
                                    blockX + x,
                                    width - 1
                                );

                            const py =
                                Math.min(
                                    blockY + y,
                                    height - 1
                                );


                            const index =
                                (py * width + px) * 4;


                            channels[channel][y][x] =
                                originalData.data[
                                    index + channel
                                ] - 128;
                        }
                    }
                }


                // -------------------------------------------------
                // 각 RGB 채널 DCT
                // -------------------------------------------------

                const restoredChannels = [
                    [],
                    [],
                    []
                ];


                for (let channel = 0; channel < 3; channel++) {

                    const coefficients =
                        DCT(
                            channels[channel]
                        );


                    // 모든 계수 제거
                    const compressed =
                        Array.from(
                            { length: 8 },
                            () => Array(8).fill(0)
                        );


                    // 중요한 계수부터 보존
                    for (
                        let i = 0;
                        i < keepCount;
                        i++
                    ) {

                        const row =
                            zigzagOrder[i][0];

                        const col =
                            zigzagOrder[i][1];


                        compressed[row][col] =
                            coefficients[row][col];
                    }


                    // IDCT
                    restoredChannels[channel] =
                        IDCT(compressed);


                    // 첫 번째 블록의 DCT 행렬 표시용
                    if (
                        blockX === 0 &&
                        blockY === 0 &&
                        channel === 0
                    ) {

                        displayMatrix(
                            coefficients
                        );
                    }
                }


                // -------------------------------------------------
                // 결과 이미지에 기록
                // -------------------------------------------------

                for (let y = 0; y < 8; y++) {

                    for (let x = 0; x < 8; x++) {

                        const px =
                            blockX + x;

                        const py =
                            blockY + y;


                        if (
                            px >= width ||
                            py >= height
                        ) {
                            continue;
                        }


                        const outputIndex =
                            (py * width + px) * 4;


                        for (
                            let channel = 0;
                            channel < 3;
                            channel++
                        ) {

                            let value =
                                restoredChannels[channel][y][x] + 128;


                            value =
                                Math.round(value);


                            value =
                                Math.max(
                                    0,
                                    Math.min(
                                        255,
                                        value
                                    )
                                );


                            outputData.data[
                                outputIndex + channel
                            ] = value;
                        }


                        // 투명도
                        outputData.data[
                            outputIndex + 3
                        ] = 255;
                    }
                }
            }
        }


        // -----------------------------------------------------
        // 화면 출력
        // -----------------------------------------------------

        dctCtx.putImageData(
            outputData,
            0,
            0
        );


        // -----------------------------------------------------
        // MSE
        // -----------------------------------------------------

        const mse =
            calculateMSE(
                originalData,
                outputData
            );


        dctMSE.textContent =
            mse.toFixed(2);
    }


    // =========================================================
    // DCT 행렬 출력
    // =========================================================

    function displayMatrix(matrix) {

        matrixContainer.innerHTML = "";

        const table =
            document.createElement("table");

        table.className = "matrix";


        for (let i = 0; i < 8; i++) {

            const tr =
                document.createElement("tr");


            for (let j = 0; j < 8; j++) {

                const td =
                    document.createElement("td");


                td.textContent =
                    matrix[i][j].toFixed(1);


                tr.appendChild(td);
            }


            table.appendChild(tr);
        }


        matrixContainer.appendChild(table);
    }


    // =========================================================
    // 버튼 이벤트
    // =========================================================

    resolutionButton.addEventListener(
        "click",
        runResolutionExperiment
    );


    dctButton.addEventListener(
        "click",
        runDCTExperiment
    );


    // =========================================================
    // 디버깅용
    // =========================================================

    console.log(
        "이미지 압축 실험 사이트가 정상적으로 로드되었습니다."
    );

});
