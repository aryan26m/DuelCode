const axios = require("axios");
const mongoose = require("mongoose");
const questionsCfModel = require("../models/problemscf.model");

const extractQuestion = async () => {
    try {
        const response = await axios.get("https://codeforces.com/api/problemset.problems");
        if (response.data.status !== "OK") {
            throw new Error("Failed to fetch questions from Codeforces API");
        }

        const problems = response.data.result.problems;
        const existingProblems = await questionsCfModel.find({}, { _id: 0, cfContestId: 1, cfIndex: 1 }).lean();
        const existingProblemKeys = new Set(
            existingProblems.map((problem) => `${problem.cfContestId}-${problem.cfIndex}`)
        );
        const easyProblems = [];
        const mediumProblems = [];
        const hardProblems = [];

        for (const problem of problems) {
            if (easyProblems.length >= 30 && mediumProblems.length >= 30 && hardProblems.length >= 30) {
                break;
            }

            if (!problem.rating) continue;

            const problemKey = `${problem.contestId}-${problem.index}`;
            if (existingProblemKeys.has(problemKey)) continue;

            if (problem.rating <= 1000 && easyProblems.length < 30) {
                easyProblems.push(problem);
            } else if (problem.rating <= 1300 && mediumProblems.length < 30) {
                mediumProblems.push(problem);
            } else if (problem.rating <= 1600 && hardProblems.length < 30) {
                hardProblems.push(problem);
            }
        }

        const finalProblems = [...easyProblems, ...mediumProblems, ...hardProblems];
        if (finalProblems.length === 0) {
            return {
                status: "success",
                selectedProblems: 0,
                insertedProblems: 0,
                message: "No new questions found for configured difficulty ranges.",
            };
        }

        const questionDocs = finalProblems.map((problem) => {
            const difficulty = problem.rating <= 1000 ? "easy" : problem.rating <= 1300 ? "medium" : "hard";
            return {
                title: problem.name,
                link: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
                difficulty,
                cfContestId: problem.contestId,
                cfIndex: problem.index,
            };
        });

        const result = await questionsCfModel.insertMany(questionDocs, { ordered: false });
        return {
            status: "success",
            selectedProblems: questionDocs.length,
            insertedProblems: result.length,
        };
    } catch (error) {
        // Duplicate key errors are expected on reruns; keep successful inserts.
        const isDuplicateWriteError =
            error?.name === "BulkWriteError" ||
            error?.name === "MongoBulkWriteError" ||
            error?.code === 11000;

        if (isDuplicateWriteError) {
            const insertedProblems =
                error?.result?.result?.nInserted ||
                error?.result?.nInserted ||
                error?.insertedCount ||
                error?.insertedDocs?.length ||
                0;
            return {
                status: "partial-success",
                selectedProblems: 90,
                insertedProblems,
                message: "Some questions were already present and skipped.",
            };
        }

        console.error("Error extracting question:", error.message);
        throw error;
    }
};

module.exports = extractQuestion;

if (require.main === module) {
    require("dotenv").config();
    const connectDb = require("../config/db");

    (async () => {
        try {
            await connectDb();
            const result = await extractQuestion();
            console.log("Question extraction result:", result);
            await mongoose.connection.close();
            process.exit(0);
        } catch (error) {
            console.error("Question extraction failed:", error.message);
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
            }
            process.exit(1);
        }
    })();
}