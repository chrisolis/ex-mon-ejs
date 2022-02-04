const express = require('express');
const router = express();
const Task = require('../model/task');
const User = require('../model/user'); //20
let verify = require('../middleware/verifyAccess'); //20
let bcrypt = require("bcrypt"); //20
let jwt = require("jsonwebtoken"); //20


// Nos regresaria las tareas guardadas en la BD con el método find(). Una vez obtenidas las tareas las regresamos a la pagina principal.
router.get('/', verify,  async function(req,res){ //20

  console.log(req.userId)
  let tasks = await Task.find({user_id: req.userId})
  console.log(tasks)

res.render('index', {tasks})
});

// Ruta que nos permita agregar nuevas tareas que vienen desde un metodo post. Una vez enviada la tarea podemos redireccionar a la pagina principal con res.redirect('/')
router.post('/add', verify, async (req,res) =>{ //20

 let task = new Task(req.body)
 task.user_id = req.userId
 console.log(task)
 await  task.save()
 res.redirect('/')
});

// Ruta para editar los datos. Primero necesitamos buscarlos en base a un id que ya me llega desde la ruta. Metodo de busqueda findById(). 
// Los editaremos en una pagina aparte llamada 'edit'
router.get('/edit/:id', verify, async(req,res) =>{

  let id = req.params.id
  let task  = await Task.findById(id)
  res.render('edit',{task})

})


// Ruta para efectuar la actualizacion de los datos utilizando el metodo update()
router.post('/edit/:id', verify, async(req,res) =>{

  /*let task = await Task.findById(req.params.id)
  task.title = req.body.title
  task.description = req.body.description
  await task.save()*/

  await Task.updateOne({_id:req.params.id},req.body)

  res.redirect('/')
    })

// Esta ruta permita modificar el estatus de una tarea por medio de su propiedad status. 
// Necesitamos buscar el task en la BD por medio de findById, una vez encontrado el registro hay que modificar el status y guardar con save(). 
router.get('/turn/:id', verify, async (req, res, next) => {

let id = req.params.id
let task = await Task.findById(id)
task.status = !task.status
await task.save()
res.redirect('/')

  });

// Ruta que nos permita eliminar tareas con el método "deleteOne"
router.get('/delete/:id', verify, async (req,res) =>{

  let id = req.params.id
  await Task.remove({_id:id})
  res.redirect('/')
})

router.get('/login', async function(req,res){ //20
  res.render('login')
});

router.post('/login', async (req,res) => { //20
  let email = req.body.email //Esto se puede porque este es el name que tenemos en el formulario de login.ejs
  let plainpassword = req.body.password //Esto se puede porque este es el name que tenemos en el formulario de login.ejs

  console.log(email)
  console.log(plainpassword)

  let user = await User.findOne({email: email}) //Revisamos si existe un
  //usuario con el correo recibido. Y obtenemos su referencia.

  // si no existe el usuario
  if (!user) {
    res.redirect('login')
  }

  // si existe el usuario verificamos la contrasena
  else {
    let valid = await bcrypt.compareSync(plainpassword, user.password)

    if (valid) {
      let token = jwt.sign({id:user.email}, process.env.SECRET, {expiresIn:"1h"});
      console.log(token)
      res.cookie("token", token, {httpOnly:true}) //Cookie con nombre token y 
      //el token como valor
      res.redirect('/')
    }
    else {
      res.redirect('login')
    }

  }
})

router.get('/register', async function(req,res){ //20
  res.render('register')
});

router.post('/addUser', async (req,res) => { //20
  let user = new User (req.body)

  //Hash a la contrasena

  user.password = bcrypt.hashSync(user.password,10)
  await user.save()
  //user.password = user.encryptPassword(user.password)

  //console.log(user)
  res.redirect('/login')
})

router.get('/logoff', (req,res) =>{
  res.clearCookie("token")
  res.redirect("/")
})

module.exports = router;