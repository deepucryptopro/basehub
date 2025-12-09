const hre = require("hardhat");

async function main() {
    const GameHub = await hre.ethers.getContractFactory("GameHub");
    const gameHub = await GameHub.deploy();

    await gameHub.waitForDeployment();

    console.log(
        `GameHub deployed to ${gameHub.target}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
