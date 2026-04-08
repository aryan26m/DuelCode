const axios=require("axios");
const questionsCfModel=require("../models/problemscf.model");
const extractQuestion=async()=>{
    try{
    const response = await axios.get("https://codeforces.com/api/problemset.problems");
    if(response.data.status!=="OK"){
        throw new Error("Failed to fetch questions from Codeforces API");
    }
    const problems=response.data.result.problems;

    const easyProblems=[];
    const mediumProblems=[];
    const hardProblems=[];

    for(let problem of problems){
        if(easyProblems.length>30 && mediumProblems.length>30 && hardProblems.length>30){
            break;
        }
        if(!problem.rating) continue;
        if(problem.rating <=1000){
            easyProblems.push(problem);
        }
        else if(problem.rating>1000 && problem.rating <=1300){
        mediumProblems.push(problem);
        }
        else if(problem.rating>1300 && problem.rating <=1600){
        hardProblems.push(problem);
        }
    }

    const finalProblems=[
        ...easyProblems,
        ...mediumProblems,
        ...hardProblems,
    ];

    const questionDocs=finalProblems.map((problem)=>{
        const difficulty=problem.rating<=1000 ? "easy" : problem.rating<=1300 ? "medium" : "hard";
        return{
            title:problem.name,
            link:`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
            difficulty,
            cfContestId:problem.contestId,
            cfIndex:problem.index,
        };
    });
    await questionsCfModel.insertMany(questionDocs,{ordered:false});
    return{
        status:"success",
        totalProblems:questionDocs.length,
    };        
}
    catch(error){
        console.error("Error extracting question:",error.message);
        throw error;
    }
}

module.exports=extractQuestion;