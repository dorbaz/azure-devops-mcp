import { AccessToken } from "@azure/identity";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { z } from "zod";

const Test_Results_Tools = {
  list_test_runs: "ado_list_test_runs",
  list_test_results: "ado_list_test_results",
  get_test_result_details: "ado_get_test_result_details",
  get_test_runs_for_build: "ado_get_test_runs_for_build"
};

function configureTestResultsTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>
) {
  /*
    LIST TEST RUNS
    Get a list of test runs for a project with optional filtering
  */
  server.tool(
    Test_Results_Tools.list_test_runs,
    "Get a list of test runs for a project with optional filtering by build",
    {
      project: z.string(),
      buildUri: z.string().optional(),
      includeRunDetails: z.boolean().default(false),
      automated: z.boolean().optional(),
      top: z.number().default(50),
    },
    async ({
      project,
      buildUri,
      includeRunDetails,
      automated,
      top,
    }) => {
      const connection = await connectionProvider();
      const testApi = await connection.getTestApi();

      const testRuns = await testApi.getTestRuns(
        project,
        buildUri,
        undefined, // owner
        undefined, // tmiRunId
        undefined, // planId
        includeRunDetails,
        automated,
        top
      );

      return {
        content: [{ type: "text", text: JSON.stringify(testRuns, null, 2) }],
      };
    }
  );

  /*
    LIST TEST RESULTS FOR RUN
    Get test results for a specific test run with detailed information
  */
  server.tool(
    Test_Results_Tools.list_test_results,
    "Get test results for a specific test run with detailed information",
    {
      project: z.string(),
      runId: z.number(),
      includeWorkItems: z.boolean().default(false),
      skip: z.number().optional(),
      top: z.number().default(1000),
    },
    async ({
      project,
      runId,
      includeWorkItems,
      skip,
      top,
    }) => {
      const connection = await connectionProvider();
      const testApi = await connection.getTestApi();

      // Map boolean to ResultDetails enum value
      const detailsToInclude = includeWorkItems ? "WorkItems" : undefined;

      const testResults = await testApi.getTestResults(
        project,
        runId,
        detailsToInclude as any,
        skip,
        top
      );

      return {
        content: [{ type: "text", text: JSON.stringify(testResults, null, 2) }],
      };
    }
  );

  /*
    GET TEST RESULT DETAILS
    Get detailed information for a specific test result including iterations and error details
  */
  server.tool(
    Test_Results_Tools.get_test_result_details,
    "Get detailed information for a specific test result including iterations and error details",
    {
      project: z.string(),
      runId: z.number(),
      testResultId: z.number(),
      includeIterations: z.boolean().default(true),
    },
    async ({
      project,
      runId,
      testResultId,
      includeIterations,
    }) => {
      const connection = await connectionProvider();
      const testResultsApi = await connection.getTestResultsApi();

      // Map boolean to ResultDetails enum value
      const detailsToInclude = includeIterations ? "iterations" : undefined;

      // Use the specific Test Results API endpoint that provides detailed test information
      const testResult = await testResultsApi.getTestResultById(
        project,
        runId,
        testResultId,
        detailsToInclude as any
      );

      return {
        content: [{ type: "text", text: JSON.stringify(testResult, null, 2) }],
      };
    }
  );

  /*
    GET TEST RUNS FOR BUILD
    Get test runs associated with a specific build
  */
  server.tool(
    Test_Results_Tools.get_test_runs_for_build,
    "Get test runs associated with a specific build ID",
    {
      project: z.string(),
      buildId: z.number(),
      includeRunDetails: z.boolean().default(true),
    },
    async ({
      project,
      buildId,
      includeRunDetails,
    }) => {
      const connection = await connectionProvider();
      const testApi = await connection.getTestApi();

      // Build the buildUri format that ADO expects
      const buildUri = `vstfs:///Build/Build/${buildId}`;

      const testRuns = await testApi.getTestRuns(
        project,
        buildUri,
        undefined, // owner
        undefined, // tmiRunId
        undefined, // planId
        includeRunDetails,
        true, // automated
        100 // top
      );

      return {
        content: [{ type: "text", text: JSON.stringify(testRuns, null, 2) }],
      };
    }
  );
}

export { Test_Results_Tools, configureTestResultsTools };
