require('dotenv').config()
const express = require('express')
const app = express()
const Person = require('./models/person')
const morgan = require('morgan')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')

app.use(cors())
app.use(morgan('tiny'))
app.use(express.static('dist'))
app.use(express.json())


morgan.token('post-data', (req) => {
    return req.method === 'POST' ? JSON.stringify(req.body) : ''
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :post-data'))

app.get('/api/persons', (request, response, next) => {
    Person.find({})
        .then(persons => response.json(persons))
        .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    Person.findById(id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.get('/info', (request, response, next) => {
    Person.find({})
        .then(persons => {
            const info = `
                <p>Phonebook has info for ${persons.length} people</p>
                <p>${new Date()}</p>
            `;
            response.send(info)
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body;

    if (!body.name || !body.number) {
        return response.status(400).json({ error: 'name or number missing' })
    }

    Person.findOne({ name: body.name })
        .then(existingPerson => {
            if (existingPerson) {
                return Person.findByIdAndUpdate(
                    existingPerson._id, 
                    { number: body.number }, 
                    { new: true, runValidators: true, context: 'query' }
                )
            } else {
                const person = new Person({
                    name: body.name,
                    number: body.number,
                })
                return person.save()
            }
        })
        .then(result => {
            if (result) {
                response.status(201).json(result)
            } else {
                response.status(500).json( { error: 'Failed to update or create person' } )
            }
        })
        .catch(error => {
            if (error.name === 'ValidationError') {
                return response.status(400).json({ error: error.message });
            }
            next(error)
        })
})

app.put('/api/persons/:id', (request, response, next) => {
    const { name, number} = request.body
  
    Person.findByIdAndUpdate(
        request.params.id, 
        { name, number },
        { new: true, runValidators: true, context: 'query' }
    )
    .then(updatedPerson => {
        if (updatedPerson) {
            response.json(updatedPerson);
        } else {
            response.status(404).json({ error: 'Person not found' });
        }
      })
      .catch(error => next(error))
})
  
app.use(errorHandler)
const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})