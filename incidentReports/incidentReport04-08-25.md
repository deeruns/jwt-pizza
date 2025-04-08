# Incident: 2025-04-08 09-45

## Summary

> My Grafana Alerting system alerted me that my pizza orders had exceeded the alert threshold that i had set, I had my generatePizzaTraffic.sh
file running to generate traffic and my server running with all my metrics being sent to grafana. I saw that my pizza orders metric had spiked and went to my logging statements from my generate pizza traffic and found this: {"message":"Failed to fulfill order at factory","reportPizzaCreationErrorToPizzaFactoryUrl":"https://cs329.cs.byu.edu/api/report?apiKey=d27f60ec1a9645e681c86ab25ae72573&fixCode=d4273b3664dc4b22b2fa2682a1e0427b"}
so i clicked the link and it said "chaos fixed" this was between the time of 9:45 and 10:00 am. The server struggles when more than 20 pizzas are ordered at once
> 


## Detection

> I detected the incident very fast as I had my grafana pulled up on another monitor next to my laptop, so i acted quick as I saw the incident happening.

## Impact

> for about 15 minutes users could not order pizzas because chaos ensued when more than 20 pizzas were ordered at once


## Timeline


- _9:48_ - chaos hit the server and too many pizzas were bring ordered
- _9:50_ - debugging to find the issue begins
- _10:00_ - chaos bug and link found, chaos ended.
```

## Response

> I (davin) responded right away and fixed the incident soon.
> 


```

## Root cause

> too many pizzas were ordered at once.
```


```

## Action items

1. Manual auto-scaling rate limit put in place temporarily to limit failures
1. Unit test of mass pizza orders

```
