const fetchRecipe = async () => {
  const res = await fetch('http://localhost:3000/api/parse-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://www.instagram.com/reel/DZKO56k' })
  });
  const data = await res.json();
  console.log(data);
};
fetchRecipe();
