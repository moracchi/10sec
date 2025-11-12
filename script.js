// ========================================
// グローバル変数
// ========================================
let startTime = null;
let isRunning = false;
let rankings = [];
let consecutiveStreak = 0; // 連続成功カウンター

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
const streakCounter = document.getElementById('streakCounter');
const streakCount = document.getElementById('streakCount');

// ========================================
// 初期化処理
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadRankings();
    loadStreak();
    displayRankings();
    updateStreakDisplay();
    
    // イベントリスナーの設定
    gameButton.addEventListener('click', handleGameButton);
    retryButton.addEventListener('click', resetGame);
    resetAllButton.addEventListener('click', confirmReset);
});

// ========================================
// リセット確認
// ========================================
function confirmReset() {
    if (confirm('ランキングと連続記録をすべてリセットしますか？')) {
        rankings = [];
        consecutiveStreak = 0;
        saveRankings();
        saveStreak();
        displayRankings();
        updateStreakDisplay();
        
        // リセット成功のフィードバック
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
    
    gameButton.textContent = 'ストップ';
    gameButton.classList.add('stop');
    
    resultArea.classList.add('hidden');
    
    playerNameInput.disabled = true;
}

// ========================================
// ゲーム停止
// ========================================
function stopGame() {
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;
    
    isRunning = false;
    gameButton.disabled = true;
    
    displayResult(elapsedTime);
}

// ========================================
// 結果表示（強化版）
// ========================================
function displayResult(time) {
    const timeDiff = Math.abs(time - 10.0);
    const isPerfect = timeDiff < 0.05;
    const isExcellent = timeDiff < 1.0 && timeDiff >= 0.05;
    
    resultArea.classList.remove('hidden');
    
    // フラッシュエフェクト
    if (isPerfect || isExcellent) {
        triggerFlash();
    }
    
    // タイムを1文字ずつアニメーション表示
    const timeText = time.toFixed(2) + '秒';
    animateText(resultTime, timeText);
    
    // メッセージ表示
    setTimeout(() => {
        if (isPerfect) {
            // Perfect演出
            consecutiveStreak++;
            saveStreak();
            updateStreakDisplay();
            
            resultMessage.textContent = '🎉 PERFECT! 🎉';
            resultMessage.className = 'result-message perfect animate__animated animate__bounceIn';
            
            showConfetti(100); // 大量の紙吹雪
            playVictorySound();
            
        } else if (isExcellent) {
            // ±1秒以内の特別演出
            consecutiveStreak++;
            saveStreak();
            updateStreakDisplay();
            
            resultMessage.textContent = '⭐ EXCELLENT! ⭐';
            resultMessage.className = 'result-message excellent animate__animated animate__tada';
            
            showConfetti(50); // 中程度の紙吹雪
            
        } else {
            // 連続記録リセット
            consecutiveStreak = 0;
            saveStreak();
            updateStreakDisplay();
            
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
// フラッシュエフェクト
// ========================================
function triggerFlash() {
    flashEffect.classList.add('flash');
    setTimeout(() => {
        flashEffect.classList.remove('flash');
    }, 300);
}

// ========================================
// 勝利音（Web Audio API）
// ========================================
function playVictorySound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + index * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.5);
            
            oscillator.start(audioContext.currentTime + index * 0.1);
            oscillator.stop(audioContext.currentTime + index * 0.1 + 0.5);
        });
    } catch (e) {
        console.log('音声再生に失敗しました');
    }
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
// 紙吹雪エフェクト（強化版）
// ========================================
function showConfetti(count = 50) {
    const emojis = ['🎉', '🎊', '⭐', '✨', '🌟', '💫', '🏆', '👑'];
    const colors = ['#fbbf24', '#10b981', '#ec4899', '#8b5cf6', '#f59e0b'];
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            
            // ランダムで絵文字か色付き四角
            if (Math.random() > 0.5) {
                confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            } else {
                confetti.textContent = '■';
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
    
    rankings.push(record);
    rankings.sort((a, b) => a.diff - b.diff);
    rankings = rankings.slice(0, 10);
    
    saveRankings();
    displayRankings(record);
}

// ========================================
// ランキング表示
// ========================================
function displayRankings(newRecord = null) {
    rankingBody.innerHTML = '';
    
    if (rankings.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                まだ記録がありません<br>最初のチャレンジャーになろう！
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
        
        if (isNew) {
            row.classList.add('new-record', 'slot-animation');
        }
        
        let rankDisplay = index + 1;
        if (index === 0) rankDisplay = '🥇';
        else if (index === 1) rankDisplay = '🥈';
        else if (index === 2) rankDisplay = '🥉';
        
        row.innerHTML = `
            <td style="font-weight: bold;">${rankDisplay}</td>
            <td>${escapeHtml(record.name)}</td>
            <td style="font-weight: 600;">${record.time.toFixed(2)}秒</td>
            <td style="color: ${record.diff < 0.1 ? '#10b981' : '#fbbf24'};">
                ${record.diff < 0.05 ? 'PERFECT!' : '±' + record.diff.toFixed(2) + '秒'}
            </td>
        `;
        
        rankingBody.appendChild(row);
    });
}

// ========================================
// 連続成功表示更新
// ========================================
function updateStreakDisplay() {
    if (consecutiveStreak > 0) {
        streakCounter.classList.remove('hidden');
        streakCount.textContent = consecutiveStreak;
    } else {
        streakCounter.classList.add('hidden');
    }
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

function saveStreak() {
    try {
        localStorage.setItem('10sec-streak', consecutiveStreak.toString());
    } catch (e) {
        console.error('連続記録保存失敗:', e);
    }
}

function loadStreak() {
    try {
        const saved = localStorage.getItem('10sec-streak');
        if (saved) consecutiveStreak = parseInt(saved, 10) || 0;
    } catch (e) {
        consecutiveStreak = 0;
    }
}

// ========================================
// ゲームリセット
// ========================================
function resetGame() {
    gameButton.textContent = 'スタート';
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
