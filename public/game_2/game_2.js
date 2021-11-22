//to start game there is needed to select control device
createSelectButton ()

const playGameWithDevice = async () => { 
    const bluetooth = document.querySelector('input[name="type"]:checked').value === "1"
      try {

        //to set control sensor from device
        gdxDevice = await godirect.selectDevice(bluetooth)
        output.textContent += `\n Connected to `+ gdxDevice.name + `\n`
        modelEl.hidden = true

        gdxDevice.on('device-closed', () => {
            output.textContent += `\n\n Device disconnected. GAME OVER.\n`
            setTimeout(() => { 
                modelEl.hidden = false
            }, 2000)
        })

        device = chooseControlSensors(gdxDevice) 

        //to start and animate game
        init() 
        animate() 
        spawnEnemies()
        let sensor_values = {x: false, y: false, z: false, angle: false}

        gdxDevice.sensors.forEach( sensor => {
            sensor.on('value-changed', (sensor) => {
                //to shoot on each time sensor values changed
                if (sensor.name == 'X-axis acceleration'){
                    sensor_values.x = sensor.value
                }
                if (sensor.name == 'Y-axis acceleration'){
                    sensor_values.y = sensor.value
                }
                if (sensor.name == 'Z-axis acceleration'){
                    sensor_values.z = sensor.value
                }
                if (sensor.name == 'Angle'){
                    sensor_values.angle = sensor.value
                    if (sensor_values.x && sensor_values.y && sensor_values.z){
                        createProjectile(sensor_values)
                        sensor_values.x = false
                    }
                }		
            })
        })
    
    } catch (err) {
        console.error(err)
    }
}

startGameBtn.addEventListener('click', playGameWithDevice )
