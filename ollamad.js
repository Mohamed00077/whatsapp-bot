async function ollama(){
   const reponse = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'llama3.2',
        messages: [
            { role: 'user', content: 'Salut comment ça va ?' }
        ],
        stream: false
    })
})
const donnees = await reponse.json()
console.log(donnees.message.content)
}

ollama()