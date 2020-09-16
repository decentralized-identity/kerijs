function pad(n, width = 3, z = 0) { 
      
    return (String(z).repeat(width) + String(n)).slice(String(n).length)
}

module.exports = {pad}