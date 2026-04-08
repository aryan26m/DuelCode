const axios = require("axios");

async function getAcceptedSubmissions(cfHandle, contestId, index, startTime) {
    try {
        const url = `https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=10`;
        const res = await axios.get(url);
        const submissions = res.data.result;
        
        let bestTime = null;
        
        for (let sub of submissions) {
            if (
                String(sub.problem.contestId) === String(contestId) && 
                String(sub.problem.index) === String(index) &&
                sub.verdict === "OK" &&
                sub.creationTimeSeconds > (new Date(startTime).getTime() / 1000)
            ) {
                if (!bestTime || sub.creationTimeSeconds < bestTime) {
                    bestTime = sub.creationTimeSeconds;
                }
            }
        }
        
        return bestTime; 
    }
    catch(err) {
        console.error("Error fetching submissions from Codeforces:", err.message);
        return null;
    }   
}

module.exports = { getAcceptedSubmissions };