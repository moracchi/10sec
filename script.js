// ========================================
// グローバル変数
// ========================================
let startTime = null;
let isRunning = false;
let rankings = [];

// DOM要素の取得
const playerNameInput = document.getElementById('playerName');
const gameButton = document.getElementById('gameButton');
const resultArea = document.getElementById('resultArea');
const resultTime = document.getElementById('resultTime');
const resultMessage = document.getElementById('resultMessage');
const retryButton = document.getElementById('retryButton');
const rankingBody = document.getElementById('rankingBody');
const confettiContainer = document.getElementById('confetti-container');
const flashEffect = document.getElementById('flash-effect');
const resetAllButton = document.getElementById('resetAllButton');
const snowContainer = document.getElementById('snow-container');
const judgmentOverlay = document.getElementById('judgment-overlay');

// 音声要素
const seButtonStart = document.getElementById('se-button-start');
const seButtonStop = document.getElementById('se-button-stop');
const seResultNear = document.getElementById('se-result-near');
const seRankNew = document.getElementById('se-rank-new');

// ========================================
// 初期化処理
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadRankings();
    displayRankings();
    createSnowfall();
    
    // イベントリスナーの設定
    gameButton.addEventListener('click', handleGameButton);
    retryButton.addEventListener('click', resetGame);
    resetAllButton.addEventListener('click', confirmReset);
});

// ========================================
// 音声再生ヘルパー関数
// ========================================
function playSound(audioElement) {
    if (!audioElement) return;
    audioElement.currentTime = 0;
    audioElement.play().catch(e => console.log('音声再生エラー:', e));
}

// ========================================
// 雪を降らせる
// ========================================
function createSnowfall() {
    setInterval(() => {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = ['❄', '❅', '❆'][Math.floor(Math.random() * 3)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.fontSize = (Math.random() * 0.5 + 0.5) + 'rem';
        snowflake.style.animationDuration = (Math.random() * 3 + 5) + 's';
        
        snowContainer.appendChild(snowflake);
        
        setTimeout(() => {
            snowflake.remove();
        }, 8000);
    }, 300);
}

// ========================================
// リセット確認
// ========================================
function confirmReset() {
    if (confirm('🎄 ランキングをリセットしますか？')) {
        rankings = [];
        saveRankings();
        displayRankings();
        
        resetAllButton.textContent = '✓ リセット完了';
        setTimeout(() => {
            resetAllButton.textContent = '🔄 リセット';
        }, 2000);
    }
}

// ========================================
// ゲームボタン制御
// ========================================
function handleGameButton() {
    if (!isRunning) {
        startGame();
    } else {
        stopGame();
    }
}

// ========================================
// ゲーム開始
// ========================================
function startGame() {
    startTime = Date.now();
    isRunning = true;
    
    gameButton.textContent = '🛑 ストップ';
    gameButton.classList.add('stop');
    
    resultArea.classList.add('hidden');
    playerNameInput.disabled = true;
    
    // スタート音を再生
    playSound(seButtonStart);
}

// ========================================
// ゲーム停止
// ========================================
function stopGame() {
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;
    
    isRunning = false;
    gameButton.disabled = true;
    
    // ストップ音を再生
    playSound(seButtonStop);
    
    // 判定中オーバーレイを表示（射幸演出）
    showJudgmentOverlay(elapsedTime);
}

// ========================================
// 判定中オーバーレイ表示（射幸演出）
// ========================================
function showJudgmentOverlay(time) {
    judgmentOverlay.classList.remove('hidden');
    
    // 1.5秒後に結果表示
    setTimeout(() => {
        judgmentOverlay.classList.add('hidden');
        displayResult(time);
    }, 1500);
}

// ========================================
// 結果表示（強化版）
// ========================================
function displayResult(time) {
    const timeDiff = Math.abs(time - 10.0);
    const isPerfect = timeDiff < 0.05;
    const isExcellent = timeDiff < 1.0 && timeDiff >= 0.05;
    const isNearMiss = timeDiff >= 0.05 && timeDiff < 0.5; // ±0.5秒以内
    
    resultArea.classList.remove('hidden');
    
    // フラッシュエフェクト
    if (isPerfect || isExcellent) {
        triggerFlash();
    }
    
    // ニアミス時の画面振動
    if (isNearMiss) {
        triggerScreenShake();
        // ニアミス音を再生
        playSound(seResultNear);
    }
    
    // タイムを1文字ずつアニメーション表示
    const timeText = time.toFixed(2) + '秒';
    animateText(resultTime, timeText);
    
    // メッセージ表示
    setTimeout(() => {
        if (isPerfect) {
            // Perfect演出
            resultMessage.textContent = '🎅 PERFECT! 🎄';
            resultMessage.className = 'result-message perfect animate__animated animate__bounceIn';
            
            showConfetti(100);
            
        } else if (isNearMiss) {
            // ニアミス演出（±0.5秒以内）
            resultMessage.textContent = '😱 おしい！';
            resultMessage.className = 'result-message near-miss animate__animated animate__shakeX';
            
        } else if (isExcellent) {
            // Excellent演出（±1秒以内）
            resultMessage.textContent = '🎁 EXCELLENT! ⭐';
            resultMessage.className = 'result-message excellent animate__animated animate__tada';
            
            showConfetti(50);
            
        } else {
            // 通常演出
            if (timeDiff < 2.0) {
                resultMessage.textContent = '👍 いい感じ！';
            } else if (timeDiff < 3.0) {
                resultMessage.textContent = '💪 もう少し！';
            } else {
                resultMessage.textContent = '🎯 再チャレンジ！';
            }
            resultMessage.className = 'result-message animate__animated animate__fadeIn';
        }
        
        // ランキングに追加
        const playerName = playerNameInput.value.trim() || 'ゲスト';
        addToRanking(playerName, time);
        
    }, 800);
}

// ========================================
// 画面振動エフェクト
// ========================================
function triggerScreenShake() {
    document.body.classList.add('shake-screen');
    setTimeout(() => {
        document.body.classList.remove('shake-screen');
    }, 500);
}

// ========================================
// フラッシュエフェクト
// ========================================
function triggerFlash() {
    flashEffect.classList.add('flash');
    setTimeout(() => {
        flashEffect.classList.remove('flash');
    }, 300);
}

// ========================================
// テキストアニメーション
// ========================================
function animateText(element, text) {
    element.innerHTML = '';
    const chars = text.split('');
    
    chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'char-animation';
        span.style.animationDelay = `${index * 0.08}s`;
        element.appendChild(span);
    });
}

// ========================================
// 紙吹雪エフェクト（クリスマス版）
// ========================================
function showConfetti(count = 50) {
    const emojis = ['🎄', '🎅', '🎁', '⛄', '❄️', '⭐', '🔔', '🕯️', '🦌'];
    const colors = ['#ffd700', '#c41e3a', '#0f8558', '#ffffff'];
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            
            if (Math.random() > 0.3) {
                confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            } else {
                confetti.textContent = '●';
                confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
            }
            
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.fontSize = (Math.random() * 1.5 + 1) + 'rem';
            confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            
            confettiContainer.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }, i * 30);
    }
}

// ========================================
// ランキングに追加
// ========================================
function addToRanking(name, time) {
    const record = {
        name: name,
        time: time,
        diff: Math.abs(time - 10.0),
        timestamp: Date.now()
    };
    
    // 新記録かどうかをチェック（トップ10に入るか）
    const oldRankingsLength = rankings.length;
    const wouldBeInTop10 = oldRankingsLength < 10 || record.diff < rankings[rankings.length - 1].diff;
    
    rankings.push(record);
    rankings.sort((a, b) => a.diff - b.diff);
    rankings = rankings.slice(0, 10);
    
    saveRankings();
    
    // トップ10に入った場合は新記録音を再生
    if (wouldBeInTop10) {
        setTimeout(() => {
            playSound(seRankNew);
        }, 500);
    }
    
    displayRankings(record, wouldBeInTop10);
}

// ========================================
// ランキング表示（スロット演出強化版）
// ========================================
function displayRankings(newRecord = null, isNewRecord = false) {
    // 新記録の場合はランキング全体をスロット演出
    if (isNewRecord && newRecord) {
        // 一旦全て非表示
        rankingBody.style.opacity = '0';
        
        setTimeout(() => {
            updateRankingTable(newRecord, isNewRecord);
            rankingBody.style.opacity = '1';
        }, 300);
    } else {
        updateRankingTable(newRecord, isNewRecord);
    }
}

function updateRankingTable(newRecord = null, isNewRecord = false) {
    rankingBody.innerHTML = '';
    
    if (rankings.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                🎄 記録がありません 🎄
            </td>
        `;
        rankingBody.appendChild(row);
        return;
    }
    
    rankings.forEach((record, index) => {
        const row = document.createElement('tr');
        const isNew = newRecord && 
                      record.name === newRecord.name && 
                      record.timestamp === newRecord.timestamp;
        
        // 新記録の場合はスロット演出＋光エフェクト
        if (isNew && isNewRecord) {
            row.classList.add('new-record', 'rank-slot-spin', 'rank-glow');
            
            // 5秒後に光エフェクトを解除
            setTimeout(() => {
                row.classList.remove('rank-glow');
            }, 5000);
        }
        
        let rankDisplay = index + 1;
        if (index === 0) rankDisplay = '🥇';
        else if (index === 1) rankDisplay = '🥈';
        else if (index === 2) rankDisplay = '🥉';
        else if (index === 3) rankDisplay = '🌟'; // 4位
        else if (index === 4) rankDisplay = '⭐'; // 5位
        
        row.innerHTML = `
            <td style="font-weight: bold;">${rankDisplay}</td>
            <td>${escapeHtml(record.name)}</td>
            <td style="font-weight: 600;">${record.time.toFixed(2)}秒</td>
            <td style="color: ${record.diff < 0.1 ? 'var(--christmas-gold)' : 'var(--christmas-green)'};">
                ${record.diff < 0.05 ? 'PERFECT!' : '±' + record.diff.toFixed(2) + '秒'}
            </td>
        `;
        
        rankingBody.appendChild(row);
        
        // 新記録の場合は順次表示演出
        if (isNewRecord) {
            row.style.animationDelay = `${index * 0.1}s`;
        }
    });
}

// ========================================
// LocalStorage操作
// ========================================
function saveRankings() {
    try {
        localStorage.setItem('10sec-rankings', JSON.stringify(rankings));
    } catch (e) {
        console.error('保存失敗:', e);
    }
}

function loadRankings() {
    try {
        const saved = localStorage.getItem('10sec-rankings');
        if (saved) rankings = JSON.parse(saved);
    } catch (e) {
        console.error('読み込み失敗:', e);
        rankings = [];
    }
}

// ========================================
// ゲームリセット
// ========================================
function resetGame() {
    gameButton.textContent = '🎁 スタート';
    gameButton.classList.remove('stop');
    gameButton.disabled = false;
    
    resultArea.classList.add('hidden');
    resultTime.innerHTML = '';
    resultMessage.textContent = '';
    
    playerNameInput.disabled = false;
    playerNameInput.focus();
    
    startTime = null;
}

// ========================================
// HTMLエスケープ
// ========================================
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
