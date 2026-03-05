const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying HospitalManagement contract...\n");

  // Get the contract factory
  const HospitalManagement = await hre.ethers.getContractFactory("HospitalManagement");
  
  // Deploy the contract
  const hospitalManagement = await HospitalManagement.deploy();
  
  // Wait for deployment
  await hospitalManagement.waitForDeployment();
  
  const contractAddress = await hospitalManagement.getAddress();
  
  console.log("✅ HospitalManagement deployed to:", contractAddress);
  console.log("\n📝 Updating .env file with contract address...");
  
  // Update .env file
  const envPath = path.join(__dirname, "../../.env");
  let envContent = fs.readFileSync(envPath, "utf8");
  
  if (envContent.includes("CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log("✅ .env file updated");
  console.log("\n🎉 Deployment complete!");
  console.log("\nContract Details:");
  console.log("================");
  console.log("Address:", contractAddress);
  console.log("Network:", hre.network.name);
  
  // Verify initial state
  console.log("\n📊 Initial Contract State:");
  const [bloodCount, bedCount] = await hospitalManagement.getCounts();
  console.log("Blood Units:", bloodCount.toString());
  console.log("Beds:", bedCount.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
