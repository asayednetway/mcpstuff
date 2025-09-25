export function formatResultsForLLM(allResults) {
  let response = "Here are the products I found:\n\n";

  for (const { query, results } of allResults) {
    response += `🔍 Search for "${query}":\n`;
    if (results.length === 0) {
      response += "  - No matching products found.\n\n";
      continue;
    }
    for (const r of results) {
      response += `  - ${r.metadata.id}: ${r.metadata.category}\n`;
      response += `    Name: ${r.metadata.name || r.pageContent.split(".")[0]}\n`;
      response += `    Price: ${r.metadata.price} ${r.metadata.currency}\n`;
      response += `    Vendor: ${r.metadata.vendor}\n`;
      response += `    Rating: ${r.metadata.rating}\n\n`;
    }
  }

  return response;
}