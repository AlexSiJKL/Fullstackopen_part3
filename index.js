require('dotenv').config()
const express = require('express')
const app = express()
const Person = require('./models/person')
const morgan = require('morgan')
const cors = require('cors')
const person = require('./models/person')


app.use(cors())
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.static('dist'))

const password = process.argv[2]
require('dotenv').config()


morgan.token('post-data', (req) => {
    return req.method === 'POST' ? JSON.stringify(req.body) : ''
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :post-data'))

app.get('/api/persons', (request, response) => {
    Person.find({})
        .then(persons => {
            response.json(persons)
        })
        .catch(error => {
            console.error('Error fetching persons from database:', error)
            response.status(500).json({ error: 'Failed to fetch persons' })
    })
})

app.get('/api/persons/:id', (request, response) => {
    const id = request.params.id

    Person.findById(id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => {
            console.error('Error retrieving person:', error)
            response.status(500).send({ error: 'Internal server error' })
        })
})

app.get('/info', (request, response) => {
    Person.find({})
        .then(persons => {
            const info = `
                <p>Phonebook has info for ${persons.length} people</p>
                <p>${new Date()}</p>
            `;
            response.send(info)
        })
        .catch(error => {
            console.error('Error fetching info from database:', error)
            response.status(500).json({ error: 'Failed to fetch info' })
    })
})

/*
app.delete('/api/persons/:id', (request, response) => {
    const id = request.params.id
    persons = persons.filter(person => person.id !== id)

    response.status(204).end()
})
*/

/*
const generateId = () => {
    const randomId = Math.floor(Math.random() * 1000000).toString()
    return randomId
}
*/

app.post('/api/persons', (request, response) => {
    const body = request.body;

    if (!body.name || !body.number) {
        return response.status(400).json({ error: 'name or number missing' })
    }

    Person.findOne({ name: body.name })
        .then(existingPerson => {
            if (existingPerson) {
                return response.status(400).json({ error: 'name must be unique' })
            }

            const person = new Person({
                name: body.name,
                number: body.number,
            })

            return person.save()
        })
        .then(savedPerson => {
            if (savedPerson) {
                response.status(201).json(savedPerson)
            }
        })
        .catch(error => {
            console.error('Error saving person:', error)
            response.status(500).json({ error: 'Failed to save person' })
        })
})

/*
app.post('/api/persons', (request, response) => {
    const body = request.body

    if(!body.name || !body.number) {
        return response.status(400).json({
            error: 'name or number missing'
        })
    }

    if(persons.some(person => person.name === body.name)) {
           return response.status(400).json({
            error: 'name must be unique'
        })     
    }

    const person = {
        name: body.name,
        number: body.number,
        id: generateId(),
    }

    persons = persons.concat(person)

    response.json(person)

})
*/
  
const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})