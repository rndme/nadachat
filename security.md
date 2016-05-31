# Security Overview


## Definitions

* **Master Secret** - A large binary string of random byte values used to create _nonces_ that introduce novelty into the key derivation process.
* **Conversation Keys** - A c521 ECC key pair, generated at run time and used to protect the shared symmetric key, master secret, and iv used for messaging.
* **Message Key** - A 32 byte value used for a 256-bit AES_GCM key, derived from the previous key, index, and an 8 random bytes from the master secret.

## Conversation Creation

|     Alice 	|    Bob 	|
|:-----------------------------------------------------	| :----	|
|  1. Generate ID and ECC c521 curve  | |
|   2. Publish curve pubkey to server  | |
|   3. Generate link w/ID, send to Bob 	|   	|
| |     4. On arrival, fetch pubkey by ID |
| |     5. Generate AES Master Secret, IV, Key |
| |     6. Encrypt above w/ ECC pubkey |
| |     7. Send to Alice |
| 8. Decrypt AES credentials via curve | |
| 9. Done, show messaging controls | 9. Done, show messaging controls |


## Key Derivation
*temp* = `key` <br>
*index* = `index + 1` <br>
*nonce* = `master_secret.slice( index * 8, (index * 8) + 8 )` <br>
*key* = `SHA3_256( index || nonce || temp )` <br>


------------------------

`||` means concat <br>
SHA3 is used as a sponge for unpredictableness that outputs an AES-256 key-sized hash.<br>
The nonce provides additional security, allowing `17,878,103,347,812,900,000` _extra_ combos in each derivation,
in case a message key is compromised or SHA3 is weakened post-quantum.



## Message Encryption and Decryption

### Alice
*m* = `"Hello World"` <br>
*k* = `getMessageKeyByIndex( index )` <br>
*ct* = `AES_GCM(m, k)` <br>

### Bob
*k* = `getMessageKeyByIndex( index )` <br>
*pt* = `AES_GCM(ct, k)` <br>
*pt* == `"Hello World"` <br>

------------------------
Each message is sent with a different key, and individual keys alone cannot be used to derive further keys. <br>
AES in GMC provides intrinsic message integrity, eliminating the need for an external MAC. <br>


## Server's Knowledge ( What is _temporarily_ stored )

### Actual conversation record, 6 messages in ~30 seconds:

```JSON

{"date":1464672188000,"cmd":"publicKey","data":{"pubkey":{"x":["11497032","1728816189","-217483954","1459139764","-1242019989","-1608117789","1941055291","678463615","1089424150","-827536991","-2011701415","1943702303","-2020757977","227624778","653213166","-2018654184","17590672228352"],"y":["1475778","-1225996989","-1106481688","2143189529","541971200","-1151739966","1061852917","17149072","1386998229","-752709907","1092715064","1818210816","-667330658","-379843032","107535460","-1282147301","17592231657472"]}}}
{"date":1464672195000,"cmd":"privateKey","data":{"type":"encode","data":"{\"iv\":\"KZ9ep9dUVsTJK57uct\/DEA==\",\"v\":1,\"iter\":1000,\"ks\":256,\"ts\":128,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"kemtag\":\"ACNTJjxUxzjWo1hM03bXDdo21X9wWV9PmjgOPEamdDxSmTO1aPN4fHPLKTsTkNE02mJzHRddwcB+iXo4eaBl+EilAT6T730Z7yyQiV\/PZ\/zs9MdJOFEIa738pCQtgBhmTxTaWTMfyGrpba\/v6kynu6Vm\/MP+CwFU1s5NeS8x\/Eb6Ql7R\",\"ct\":\"HA0NeS2SxPmNxPwkoLE25bAfHk4AkDZ4kC2PxAb7FY3FwmP03mzi0PsTQ4TfgtEmiWJ6gyX1TgbbGDoW\/1MAnneOU5ehnJv4iGwJ\/KlgSSCt70eQymrQWSJcF+GtQwzhVUhmlBj66VdXNGH5jLzg9fXzpnfdAbQlgEzZjGEz\/pLW1OrfLiCY90xo9cIAziLP\/ouyJaqW7Ys9RYeVurdVzN7ZZVHrvpB9hwy6ykh3JzmUeAcGMAyboc9kdXyt+ZdseWDdi8dfbLNCQNHKiCN0\/zwanAKj6atLRzLsuqxjtnql4EH9crhvV1zzJ8KoopRt3f6HQC7lPVeW4cTkizZLmsrTBusjnlCbAH7RG8DCHcBkJS7QIJYKY5+Zo\/HB8gCVcUxRJXdlHLpbXMoDUyLL+0QjOEl0JIwafxMYHRD0i0ETCzc\/M5+IFK0bk8hKq2mVXlNA3yD\/onIz33huqD65Fletd5V5DeZQ0HNf4j\/vM7I85r4iz6XNOfJQlM6SxaZXibqVeIMLbGX7bC\/fz7LQmEEcNdTlV4e+bCJq\/vX21w6J4kYCFe6v8zp8u0Ie4nc+5r+OCcQwRIdgjtQzmjE0BaYNIJXgDz0E+SSnxydFnlthysbr9QRL7NHsVlfTA+h0J9Cl2p4tfFvBEoWQ9GtLcSj6Oyi61tReE+OQDBOHbjukFdK6IWEKB7JH5DDqeMgV1iVrb5TACoCjiB8rlgXNgfdaMIkIBOEPKBTAZnqyOIa37W08pL3UuTvZP7UjZKgEfa+b7RQbdTMLbgMRrs+Fi+WcESulJ0dvGWhECTituh7DrYt4kD8z+IHZjCNVYFMWS2o6WBzW6hxj\/jw\/dNAyaAesGhDmNvoPVsAauoeltxBMKcExeT6lZ2G3wyurjCNyh\/QBrbxLELUK4FyxhpfcdLdfrqvHUgS4dHYPTutA8NDdRkCUj5wv0tn0JdgoU26O1+vHCH9PalNj\/TrlPGOzoPquDCO2oS3xUu6cHJsNY4RCLg19mjfaDvpbPVqe29UietowCeGjBfm1PImnwJsKjJ2GxLbbupTDkzyWWkGYDHPxTc4pmqUyRxeAyAaEptgez3u5Wa7S0\/DFHH7xqWCqUgZz2wEa9CfshDod6VkxNPnnDyoJFDmp8T\/HmDB\/19ENfKelyNN0fIq4hPpYMbENCLKVB4YDZQMaGnp0xNEM4sX6cimoThPsihehEd3rbAIJbiiRghSnTr6BvwdbIbCRMZ3Elxwn6L4S7AmVcAb8bc4s9h5sIDsP+MPhO45LWzHP4nhHUcuSQs97eHWwjN+hPHjwP0JZv2FocvftofnZM5IgnbBUV1vzCgkFvPnb8qDpx1TyAiKkXFZsr+GvAx3U1WZtJDOqUc0KdHrcD+p7QDre4YelX\/AhuVY0wCtYsoRcAr8uejemgm+EoBo9rxycYBnpOV95dlUfSmPYhGGmH3Uqw7Bvmps\/aT71i2z4cpl92PA0R+lipzkzN1Sy3W+weep4rDoV7qD8Bdvq5yF9ofXMtHf+\/l02zx7SPsoG0yoZZeW5x5HKOLQ4Bpye6GEuI\/ADWkL2KD7JSIs8aKBsP9S7pdam1UeH0\/Oh\/ltgG+cNHV3uaQp0yRSjkFy0KRye07CszpLhaw1O5eTROaD\/FoFluJW62jRghGjvrknx8dONHdkC1xNAscW2BCOpqto\/wYDeEiP4kYn18poRdivOYH+8Y9GEQ3XIrpJvzy7fhhc5ZT1xvFSpnTHlbgm6FHaIXxNYLHXrsqEJe1bZk4zTPmsyKh\/VtNMlkqhCaTnMYBseTwMH9GR8QHxZHnaqT4q+Y3b2IkpUdcdvwihXSAk4YOjJugLO4LfqcgphyZnYu+7IbdwNy97cqxx5h0esVDocRZBh8zPWemIc7ehrscaCuG7gzMOCdonc1RPrK4YhUu+cHpTIzx2yXVf1HSptZZIS1fk7sbakGoigB7vcFPazbZ5PdGlS\/PUZ2X9lqbIWJuMqFcL4ApOFIbRjJMeLPdyq+rmnayzswrRCob1YGXPDTUDGeHzeUIn5jlIRYWN+CImg\/qCDla+VmZWLeEFIoWOi\/Jt4NWpI0ZWMQ3nkpC0DkaxL48lRg7LYK3AvIOs\/AS+n715DRpsmB7PmUNP\/ecIYWKFzWqaHC++uHu8sP4Rq2TjawOdAJTbqAIPwa98qJJYCPQ9y4MhWynAAR2nwYQYWH3sIyd3rZHLnB\/WFomQXFhd66cY+yOwPEkd8mttarAk3kKc8eJgA6Z1jdBaJoAGJsgSq\/K8gDDBX\/RH67YIYXKfy3KB6xO7uAnAd0p7nozxYm6ua1VTh2f3ykrQaFInomrLN0Jk8llR1SoHxVnAsiGCt6+L8wIpHpzor36b1zxwKqMiGDKep9iTZtjERakq5fzMiqRocUj23gDndzX+d2ZZPlulpk7\/TUEMWAjgCUKMxmsoE9mLGKBpvD\/qIMYcy3AmWPRFG3flNlJgGiFIivB0hh3j8xmRJPXtYM\/mzux93T0JuFCyCLOcNtbFuyMS32WiykHB771XnL0isdxStt4y01ZR+Wjfr0wsDuY9PkOes3faI4mGwlKidWfRfoJWad+eo+QMk5ghrQ+Qfxi4luJxqglhzQ1ViqXQoREC4BQTYGQyqhfM2fHwno4OhANa7PuqiDwTMyR5hZwkkrqKX75QNZX3Sj\/Dq\/BefRj07SrdtorNC8zuB4aQq+Tqdj+xJlRNR1bSv\/yJ78OudE8KNYAU6gGY\/LwMZwckJeeH3H+6Enmc9R+agYg2m6DKmL\/9ChRQsLFsPqRonVom0woQWVpxMdhM55XIG\/D+LAdB8kAiS1iUDgAsn+DRV+O7WQrYg5dpIhGLf8NlRJMxGyprPW8U0sraxUSHCMkj1GeevlaHFtyZf++lrV5w7bAqdFJMg1kAxC+2DV9v8xhrFXENRzzttALfKmlmYWvL3mZ5LdQuHc4J7UoiHjmyVqETos0X5ETWYD4cyy5CNk5QnhsyOAQDVaXEZZJpJNkpHU5u1Yq\/xLY11TcUSTcnQtz8lMGcVnD6anpoPL8MsT7lwMMtkxM7vOJEyTj3CQv2fjm5gnoVf0khvjVTm7IhtSKi0pNStVGDd0+a5udO\/SqJhQ4YstNrCwqZYDHgyuxSeXcfxx5k9+4xpygIiYVZUBt2YQvnSGq3VzxRp9X+x9cKziNhRXshNDiiPdK6oLtFNRhhNWv3UOXI7q6cED\/AZhALGMqD2COc1XB8BeOy+MIXTpDRLPmoMZRPlTCOybzlYNXJqOLEES5FC6NrWwwUBr98xc9gEvap4MPbRB4YwIeeduIdjD9USTeUKLSzgGxqhoWwntMLOYZZVy9mnbCf55EEL8NBErAU+6YI8wPVSnxJIRJROhRUJ8NBboxDLxF34Dh8YHX9urYY8PBniTFskpktI3XViYqtJLXt9gNuwKEFhqotPUc0jM7+\/8CwgjVOXPXDRFvSIkU2UMfDKIEYiouTVUlifuuNY92MQeK1nbm58rdSrcI9sRNrU883GNsFogd5pG6GSn1lT+4dPiJ9tc0C8KLCVXJIc+ShgislcDeciKyxsExshN0BewQyRzHGOR8spmv5ByRuB7yInc8uy4AqkkkRyv27t4wqBZhjqg5Nf9NcTQkOt9cta48HwLBE2+7FMqUpt+BgCvWHs2injteEqBd0QlrGzwlXuerNYve+CPOwpnDWy\/Iu1q2czGhtkTfx3z5WLvwggL\/3K7yjkhzo3VOxCAeT4N9U\/dJVnI8aCUEoDy1Cfehfif5XE6kKXLE+1wxrKvtpPbxPsqBtEf\/l6UojpHGZVZ0lNTRkkpIU7qGPfXSFqKeX6aImg6UxCRViRO3b2TQwO\/cl+KpyUwR2Bhh54H38ns3GYSTOGm7ahpUEr0Rk2wDml3VFvyUyAtmukh3aBnvLXUWCpB5kXJq7OXaIGaYeaMTv+Gfx3BNIZRMMFgaXl2mONzslBow1tdSbs8\/+\/12zhxaQnuUIjWYqwve2JWJQGW\/7Elg3EXnxCsK9by27P5Y31ymHZh14b44jkJHtaFDjxhCx7YOZkBW6NHn+AYfNsRNFtLwFQw6psYaSbsae9v\/QMVsqY4IsRoHLqA4AMgZ2YgIZ9AWccF5VSlXjiev0BERlh0gDBE5R7jhzk23dlOeQKHgprEO9e5DgRgoNNdVkso6Bww10vc0gq446wEM3Vx0zWUn6HnHd3AR3K1ENn6UI\/mYYb8ueYMufOG91mPt\/iw2uYWjoJMJK2WL6f9cEo5Z9fatSoM5C0TC71nyz2uRha37JFLv5z57GZDX40hNCZCPV7hXsF+JRmm1A\/EUi7oFRfihpuHn4HCUnHLmA6kML+M5bfQPmzdqbyB1GBUcRLRVlPWu\/91GfmoOUmZBtwfxNQ5LVUu\/WND\/g+cIyOlaLZ5HZ0pWpcbP49vbCqn5uUjqPL8OYwB50XVdiANvTw34HhYE+hvx6dBdneRV1rwYyOM3Hee4evZJz9rhhrSycNLRvJCCcyZUEzwkMe3QAp0mnhr\/EIm\/H17eHqkNIZcRajkCYlu50xl62W5J+4w0N9AnsYRJfWALHf2ECKEGvZNoA3CAQqiQ7gqH+ahyq5O5yqmlwo6zAOZF6x9CRmSBHU6NXL9q8McXm\/WRJu\/h2glHdDpYfgCPwGO2RqpyIyx9KSGj6U42uSBT8hsSTOG0jy5wYaB6yoYtOCLuQTG6r1pIvZItgmAH7omuNR3tfRlyDr2FEwcm7l9SLuhC5GCPz34heAqCsHiK9U\/6K5S824LyZPYSDNtdn\/y7LhS5JTlJy+7uS0ZsWnIV86E7SROgiUVpbKsEQP6\/YsdbsiFI0DSB6dl+HltDAmolx9ZMOEF2QXy1sZVfA9FQVVdeRJiHDxQCbAXc6ilItz2\/bzgGyMuFBEcGtsMmIhasV9rOV3xrNzP6Thjy5zlI9qUVRQn52X5bp4NHxkhU1uu61A5RSdSvfwZDobS8BOyXgNIljp7TuQGJI\/g3I+vTBfG9oKf3bKzzeMqZQtwnv0uON2uj5S\/o1CKepw82mE65XSB2IMyIXGoBxqOg2o+UZht01ZgRWXPuRby1WJKVln34dt1QsmYhWG9vr7kHfbDnMMAevOc+AVClAJ0mdKFK5IhntcCJHedzaLJY8hik4c+JgXJHmqsMJ1OB8ytXjpN15zymdNupCqKKtV2Xnsmb9Bl9jnATERiWd4i5CeMh4lmX9AUj6ytTv5xI3Fle2RCbR3NlnMMDjB0s2zgloNIykcrVxxxIUgpjLpFg1jhCN4piq+gpwaSkv4p2+mln3OUqXNK4QlskW7U6Q5chpSz9iwRHwM8mIXJ5chSoiSkTNFeRRgHHKu\/zDbfEd8jimlw2CCZr2kg9y2S63nvKMCjXdmaiVZHErtl0OX8hNR11XYb3SOISbTnBiJlVQqs+dCdecuaK9h7Osb220\/xY8ml3wSOcNq5Mw5MOkq+rH2td6QmyI0+\/Kn1DUt2cJd1HuOBBsVszDt5dFny2bAXhA5cm0brZXNk4GTS6PNkByo+zSIWNOobTmoBYSEmnrKE9jjwMXVnzTC73cHr1Z+kl2K4yuarvmbcoc\/KofZON0IZiH3VuC8oOUXkq1EwwSOTmR2FiX9\/zcK\/QJhJBRdthqUFHYDIxosLKR6JLxydVfxyAADUtxLT2aXAmDKNa2TX\/xItxW5DKwilsGjmxSKHR5SXOq7Yax13K5EMC6kjfncHCFyKi91VzBBx+tEa6ikP3q+G9gpS4+0Bd4c8qIsCGeJkAF\/lEGtVx74huqK5V3EsvrXM0IJN78Ew82n1an7UqESVlbLenYX71eBO0vn1PmDS9Vo+CHGukBadUJ3tagjxR2gmZd4oGKD3R6jCYYV6ywt3JLKt2y\/e2NkFAsHpB\/FwC39H4ENUkw3lSJKArMN6eyTm0lAhdmJnTU18+3fv\/nu0FMxGFn4yT0kIeucZ4l5vgtyCZ5sFnCZnd7xvJVbY09IKHvfokwR+YhByGP3ni1iGU4QBo3h3TSTRFa+olxvJYr9eqb9gUJ3yO82azdhlETbqAtxKiEN5A8luQAIyl4PLbUHYjkn4W1wF12cvkNAgvfUDVDO5G\/6I0OVIwiCabqEIMvy0+DaL9CDumVXdlIpOIEb9dvSKbcz+q9y14A4h4ztDo4AtFG4j3JcZrdkpcqg2nKNF5BXQruYtb1KNEcJwvMamYvYgiTDdlFbV2Qd08vNm6aA9dO8woqb6gIo9sVMGC4IJGBMlpzhNPtZMlYQzxplktBsdCLjhyor28yXAtMQimJ4k+J8kiQopVGMSqz3e4WUAC9FBwmpNTDSEnaf50WO1s5PGKzNNMr\/Mj1\/AXixWCxzxdK\/wJZMi76gAtKZnR+rXvXp1ZUh7yJj+G1VC0oXdeN9DunEnL3FCl3L2Ti2CQhv7c8Rb+\/ySvfuR3ERV0Ng+fXvH0Wy5nl5GYumZk4bDVIqVwfpUa2OKp39UlJOvIwyhq7T4O5Zu\/fr5S5nwi0\/5OeiVYUi5pI7VPMgJ3WXddF6\/DTt8ng6Jt5o7iTwQ8WSg94r4JuSU4+5FMzIZKD9m+aldRJ\/Vgk+ymrxuGvGAyLHSy4BKf3hRbbTi1eMrrdFHtJms+310dvzbu5tQghmnH\/g+C8spr4jgYatr3n9DhfUeA8pj7\/DuJ7EbWikHDHL+3sy\/7j86vMZ8wZaXQMnQ9VNaYpuzXz9qb1qXEa4B7dKlCJ4L1Z57GKLbcAZ8bJ1l3TnbAnPHoC97+gVi55nyAa0JhmdiW9R0bmZ0XO41CypBWjwSFM7scydF7utDDpjeR4Kk+odHevJT+7jR48GOu74Fd3yKt9HQfYkJd7hEh+\/6xltLMj4ZLC+SfdFrh+VNxClAmPPmhjAQwCr0\/sxZOZn6f27p+7Dy0dHa\/DDwRl9biBK3cr\/QGTVEDjOEgPp8dLahDi5jI5cC0D2ykXoqQDd2ebyXR17iOuLpW4OTjU9gWsERVlutegXxzsCVqVdrpzonBNHWltHOctrCo1xCQ69t1hyfwbFT3as7IghU5cO9qMMcPIya3vkcSyeJye5MBaCSdmD0y9+4IlfpCEphDc0rfbP2oNGnQ0WfGK7TjTgeWwgpgyqpaSwizJfTL1BwWEEhW5zjqLEKePow+JdXCN7ILcRzFDrLpZ5WJF5jKCPiRjoOf3V9ZjgGY5EJb0fm\/Gy1gMn2zX\/Rbv6RO5AoIEcXUT7\/OuVns2URCwzidoWyKfScD5\/MPwV8TDwFNbV7ZYZ7rISUCJz8Pw7dIQY\/uXDk6uAWCQRuPHRm0gtDpZunl0p1yuwOnmerbEUK9P0xG24gl\/i4ChsbX4BGj2Itf1NF8SRmNKHH4MCpHO0UQaRLM0tpC643ozv\/HokzLIfJfwTBCdhQF\/qNG18PKBbHzhiKvtl9ajkb3NX5LWPEV6OjCyKQLSaMsICmvJqmgZXZSqc+wBcDQemzZReIFn5Xiaczymf6RZPPObO7do0AjEmkig2+R5w+I18hT1fBq73ucTlOwTcQPtyOeK26WJ7zWJ8kerXYQvUB+g5v+YBHwk8uBnUK0+IdK6KSwzQB1fL8cxHcN99BY7LqpwBOajHPLL2O0e\/mM11HHqdqHXFmKpKjNBhQijUEw9rloPyveGxRambjW+SAZr8VR7etUEhRJUtUx1wG2aOMDWTQgvs2N\/amqcbv9J4ehugvefy2C+JRQQQbe59XrmJBFGBL43ylE6MCmZyDI2VLDZbROwP4vXOzypg4rx85aXgu8hJ8KlrXkjqh+c0855F\/smgGVwD0nEJIE\/9mvDujFgrfUdG6u8kMiY\/UmPg3Bg2mlEElFBsAYCrtCMvx1BSnmFOnLksYzhbILLFgKgmopTrsZNFou7hGI25SgmfKPGvq9xmPwcBxhehnPHP3U570JSFg9y2QEeJM3rynuGKWG+EOBbwsSWedEqq\/Nvcyyoh1M5ncqJFI6CUYY2JdWC0rFc3hiqmPYqBKP0kagNblDl4Z8DYPySSKHlv0yZRw+K091vgfEYae1kY06HRpIlpUYJKoY8wP43jspSOojc7vJgHW2UxXqGjV5SPSUXqnHJlPs8\/CuE8vzxFgIVZl9KyScYddx1rsi1yMQ9NpCEHgo9J22owCFqaYTX+xBjR5tkF3dS9ZmaEndvQXSjWxaJecRz9GIzUp4EgqlevJI8CHFHzXJq0RGh4DLPfLkUaa3Xd9cSlAPvtA352sjEJxq+HeJewXHR2n8akLQX8xaaU7BnFk+rTEPCu04COqsP\/PvOc0baZ+q9IVx631\/zQcy2olg\/p2adQx6rff5OSzCoavYCv\/OacuTRN3roE2ypit2z6gp06kAf16Abvr\/zBiZeOnVZuiWoJA5gGf344Ek2DvedlrU0QDb8ZWfma9M+PxlGPT5lf78jANOW5Al2mTzh9n4O6KavS6EAUufqo6H8dfncATpwWc4LiKCuJyjNSfnYUeVYogBrkCk4XazRzx9aWKE9tQoxxf8BzX2LeeU2kDZlYP\/yO1Ij\/aYs8Y9Ce88N1Kr8YdEmbB\/Y+Ix+e3CcK8qsDFov89FAS8Vo=\"}"}}
{"date":1464672198000,"cmd":"send","user":0,"tx":"O0C0hNwTK_Kr","data":{"i":"0","iv":"WFORn0ZJp\/+L2iZIdGeTMg==","ct":"vgPs+2sEAx1bVP35Kx+n1+RcqqYAAQ=="}}
{"date":1464672200000,"cmd":"send","user":0,"tx":"2GKNs2jjO5FB","data":{"i":"1","iv":"GVJTLSTiYi7Z1luKAFBkvQ==","ct":"V+NAzIHUTZeN6+ud0FemmCPLSH1Yow=="}}
{"date":1464672207000,"cmd":"send","user":1,"tx":"LyWnSTQzcFys","data":{"i":"2","iv":"Vg3fYw5SbRRu\/BbrylJ3Mg==","ct":"8Hgb4jjKEjpbXj\/p7z66jKgJk6zx75fUr+71nzvfzxSZAzh8"}}
{"date":1464672210000,"cmd":"send","user":0,"tx":"B5jvj40Y7PE4","data":{"i":"3","iv":"QFhbRAe7XkiARHoVzDDTXg==","ct":"xad3+psX\/znLJxWvYnAIFobaz91TGFSTcA=="}}
{"date":1464672212000,"cmd":"send","user":1,"tx":"JTMpn6Xn7M2K","data":{"i":"4","iv":"kIVHAEMhN+\/B3ybQfjoI5A==","ct":"Nm2yGwBa7ekEfkeL7Y0CClU4tFSODbY8HQ1qwn0="}}
{"date":1464672213000,"cmd":"send","user":1,"tx":"qanU7KudnzBb","data":{"i":"5","iv":"UysBsYWIRl7VB6EkhHReJg==","ct":"QrQtDEP7rsWnAYFCQLLiKHT0mr4dcA=="}}

```
--------------
Normally the file is cleared after `publicKey` and `privateKey` reads, and every few kb of messages. <br>
The private key (2nd line) is protected by the c521 ECC curve, AES_CCM is simply a wrapper.<br>













